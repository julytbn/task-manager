import { prisma } from '@/lib/prisma';

/**
 * AUTO-CREATE CHARGES SALARIALES SERVICE
 * Creates Charge records from PrevisionSalaire when salaries are due
 * Called from notification service or payment due CRON
 */

export interface ChargeCreationResult {
  success: boolean;
  chargesCreated: number;
  totalAmount: number;
  errors: string[];
}

/**
 * Automatically creates salary charges for current month
 * Called after payment-due notification (1st of month)
 * Creates Charge record for each employee with forecasted salary
 */
export async function autoCreateSalaryCharges(): Promise<ChargeCreationResult> {
  try {
    // Get current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all forecasted salaries for current month
    const previsions = await prisma.previsionSalaire.findMany({
      where: {
        mois: currentMonth,
        annee: currentYear,
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    if (previsions.length === 0) {
      return {
        success: true,
        chargesCreated: 0,
        totalAmount: 0,
        errors: ['Aucune prévision trouvée pour ce mois'],
      };
    }

    // Calculate payment deadline (5th of next month)
    const paymentDeadline = new Date(currentYear, currentMonth, 5);

    // Create charges for each forecasted salary
    let chargesCreated = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (const prevision of previsions) {
      try {
        // Check if charge already exists for this employee this month
        const existingCharge = await prisma.charge.findFirst({
          where: {
            employeId: prevision.employe.id,
            categorie: 'SALAIRES_CHARGES_SOCIALES',
            date: {
              gte: new Date(currentYear, currentMonth - 1, 1),
              lt: new Date(currentYear, currentMonth, 1),
            },
          },
        });

        if (existingCharge) {
          console.log(
            `Charge already exists for ${prevision.employe.nom} ${prevision.employe.prenom}`
          );
          continue;
        }

        // Create new charge record
        const charge = await prisma.charge.create({
          data: {
            montant: prevision.montantPrevu,
            categorie: 'SALAIRES_CHARGES_SOCIALES',
            description: `Salaire prévu - ${prevision.employe.nom} ${prevision.employe.prenom}`,
            employeId: prevision.employe.id,
            date: paymentDeadline,
          },
        });

        chargesCreated++;
        totalAmount += prevision.montantPrevu;

        console.log(
          `✅ Charge created: ${prevision.employe.nom} - ${prevision.montantPrevu} XOF`
        );
      } catch (employeeError) {
        const errorMsg = employeeError instanceof Error ? employeeError.message : String(employeeError);
        const error = `Failed to create charge for ${prevision.employe.nom}: ${errorMsg}`;
        errors.push(error);
        console.error(error);
      }
    }

    return {
      success: chargesCreated > 0,
      chargesCreated,
      totalAmount,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Auto-create charges service error:', errorMsg);
    return {
      success: false,
      chargesCreated: 0,
      totalAmount: 0,
      errors: [errorMsg],
    };
  }
}

/**
 * Creates a charge for a single employee
 * Used when manually recording a payment
 */
export async function createSingleEmployeeCharge(
  employeId: string,
  montant: number,
  mois: number,
  annee: number
) {
  try {
    const charge = await prisma.charge.create({
      data: {
        montant,
        categorie: 'SALAIRES_CHARGES_SOCIALES',
        employeId,
        date: new Date(annee, mois, 5), // 5th of the month
      },
    });

    return { success: true, charge };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Gets total charges for a given month
 */
export async function getSalaryChargesForMonth(mois: number, annee: number) {
  try {
    const charges = await prisma.charge.findMany({
      where: {
        categorie: 'SALAIRES_CHARGES_SOCIALES',
        date: {
          gte: new Date(annee, mois - 1, 1),
          lt: new Date(annee, mois, 1),
        },
      },
      include: {
        employe: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });

    const total = charges.reduce((sum, charge) => sum + charge.montant, 0);

    return {
      charges,
      total,
      count: charges.length,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching salary charges:', errorMsg);
    return {
      charges: [],
      total: 0,
      count: 0,
    };
  }
}
