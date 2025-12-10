import { prisma } from "@/lib/prisma";

/**
 * Service pour gérer les Charges (Expenses/Operating Costs)
 * Responsabilités:
 * - CRUD des charges
 * - Catégorisation des charges
 * - Agrégation par projet et période
 * - Calcul des coûts totaux
 */

export interface CreateChargeInput {
  montant: number;
  categorie: string; // CategorieCharge enum value
  description?: string;
  date?: Date;
  projetId?: string;
  employeId?: string;
  justificatifUrl?: string;
  notes?: string;
}

export interface UpdateChargeInput {
  montant?: number;
  categorie?: string;
  description?: string;
  date?: Date;
  projetId?: string;
  justificatifUrl?: string;
  notes?: string;
}

class ChargeService {
  /**
   * Créer une nouvelle charge
   */
  async createCharge(input: CreateChargeInput) {
    return prisma.charge.create({
      data: {
        montant: input.montant,
        categorie: input.categorie,
        description: input.description,
        date: input.date || new Date(),
        projetId: input.projetId,
        employeId: input.employeId,
        justificatifUrl: input.justificatifUrl,
        notes: input.notes,
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer toutes les charges avec filtres
   */
  async getAllCharges(filters?: {
    categorie?: string;
    projetId?: string;
    employeId?: string;
    dateDebut?: Date;
    dateFin?: Date;
    skip?: number;
    take?: number;
  }) {
    return prisma.charge.findMany({
      where: {
        categorie: filters?.categorie,
        projetId: filters?.projetId,
        employeId: filters?.employeId,
        date: {
          gte: filters?.dateDebut,
          lte: filters?.dateFin,
        },
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
      skip: filters?.skip || 0,
      take: filters?.take || 100,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Récupérer une charge par ID
   */
  async getChargeById(id: string) {
    return prisma.charge.findUnique({
      where: { id },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une charge
   */
  async updateCharge(id: string, input: UpdateChargeInput) {
    return prisma.charge.update({
      where: { id },
      data: {
        montant: input.montant,
        categorie: input.categorie,
        description: input.description,
        date: input.date,
        projetId: input.projetId,
        justificatifUrl: input.justificatifUrl,
        notes: input.notes,
        dateModification: new Date(),
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une charge
   */
  async deleteCharge(id: string) {
    return prisma.charge.delete({
      where: { id },
    });
  }

  /**
   * Obtenir le total des charges par catégorie pour une période
   */
  async getTotalsByCategory(dateDebut?: Date, dateFin?: Date) {
    const charges = await prisma.charge.groupBy({
      by: ["categorie"],
      where: {
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    return charges.map((charge) => ({
      categorie: charge.categorie,
      totalMontant: charge._sum.montant || 0,
      nombreCharges: charge._count.id,
    }));
  }

  /**
   * Obtenir le total des charges pour un projet
   */
  async getTotalsByProject(
    projetId: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    const charge = await prisma.charge.aggregate({
      where: {
        projetId,
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalMontant: charge._sum.montant || 0,
      nombreCharges: charge._count.id,
    };
  }

  /**
   * Obtenir le total des charges pour une période
   */
  async getTotalAmount(dateDebut?: Date, dateFin?: Date) {
    const charge = await prisma.charge.aggregate({
      where: {
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      _sum: {
        montant: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalMontant: charge._sum.montant || 0,
      nombreCharges: charge._count.id,
    };
  }

  /**
   * Obtenir les charges d'un employé pour une période
   */
  async getChargesByEmployee(
    employeId: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    return prisma.charge.findMany({
      where: {
        employeId,
        date: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }
}

export const chargeService = new ChargeService();
