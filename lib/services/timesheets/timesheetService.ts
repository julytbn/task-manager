import { prisma } from "@/lib/prisma";
import { StatutTimeSheet } from "@prisma/client";

/**
 * Service pour gérer les feuilles de temps (Timesheets)
 * Responsabilités:
 * - CRUD des feuilles de temps
 * - Validation des feuilles de temps
 * - Calcul du temps travaillé
 * - Suivi du statut des feuilles de temps
 */

export interface CreateTimesheetInput {
  employeeId: string;
  projectId: string;
  taskId: string;
  date: Date;
  regularHrs: number;
  overtimeHrs?: number;
  sickHrs?: number;
  vacationHrs?: number;
  description?: string;
}

export interface UpdateTimesheetInput {
  date?: Date;
  regularHrs?: number;
  overtimeHrs?: number;
  sickHrs?: number;
  vacationHrs?: number;
  description?: string;
  statut?: StatutTimeSheet;
  validePar?: string;
}

class TimesheetService {
  /**
   * Créer une nouvelle feuille de temps
   */
  async createTimesheet(input: CreateTimesheetInput) {
    return prisma.timeSheet.create({
      data: {
        employeeId: input.employeeId,
        projectId: input.projectId,
        taskId: input.taskId,
        date: input.date,
        regularHrs: input.regularHrs,
        overtimeHrs: input.overtimeHrs || 0,
        sickHrs: input.sickHrs || 0,
        vacationHrs: input.vacationHrs || 0,
        description: input.description,
        statut: 'EN_ATTENTE',
      },
      include: {
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer toutes les feuilles de temps avec filtres
   */
  async getAllTimesheets(filters?: {
    employeeId?: string;
    projectId?: string;
    statut?: StatutTimeSheet;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    return prisma.timeSheet.findMany({
      where: {
        employeeId: filters?.employeeId,
        projectId: filters?.projectId,
        statut: filters?.statut,
        date: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      include: {
        project: {
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
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        } as any,
      },
      skip: filters?.skip || 0,
      take: filters?.take || 100,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Récupérer une feuille de temps par ID
   */
  async getTimesheetById(id: string) {
    return prisma.timeSheet.findUnique({
      where: { id },
      include: {
        project: {
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
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        } as any,
      },
    });
  }

  /**
   * Mettre à jour une feuille de temps
   */
  async updateTimesheet(id: string, input: UpdateTimesheetInput) {
    const updateData: any = { ...input };
    
    if (input.statut === 'VALIDEE' || input.statut === 'REJETEE') {
      updateData.validePar = input.validePar;
    }

    return prisma.timeSheet.update({
      where: { id },
      data: updateData,
      include: {
        project: {
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
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        } as any,
      },
    });
  }

  /**
   * Supprimer une feuille de temps
   */
  async deleteTimesheet(id: string) {
    return prisma.timeSheet.delete({
      where: { id },
    });
  }

  /**
   * Valider une feuille de temps
   */
  async validateTimesheet(id: string, validateurId: string) {
    return prisma.timeSheet.update({
      where: { id },
      data: {
        statut: 'VALIDEE',
        validePar: validateurId,
      },
      include: {
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        } as any,
      },
    });
  }

  /**
   * Rejeter une feuille de temps
   */
  async rejectTimesheet(id: string, validateurId: string, motif: string) {
    return prisma.timeSheet.update({
      where: { id },
      data: {
        statut: 'REJETEE',
        validePar: validateurId,
        description: motif,
      },
      include: {
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        valideParUser: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        } as any,
      },
    });
  }

  /**
   * Récupérer le total des heures par employé et par projet sur une période
   */
  async getHoursByEmployeeAndProject(
    startDate: Date,
    endDate: Date,
    employeeId?: string,
    projectId?: string
  ) {
    const where: any = {
      date: { 
        gte: startDate,
        lte: endDate
      },
      statut: 'VALIDEE',
    };

    if (employeeId) where.employeeId = employeeId;
    if (projectId) where.projectId = projectId;

    const result = await prisma.timeSheet.groupBy({
      by: ['employeeId', 'projectId'],
      where,
      _sum: {
        regularHrs: true,
        overtimeHrs: true,
        sickHrs: true,
        vacationHrs: true,
      },
      orderBy: {
        employeeId: 'asc',
      },
    });

    // Récupérer les détails des employés et des projets
    const timesheets = await prisma.timeSheet.findMany({
      where,
      distinct: ['employeeId', 'projectId'],
      include: {
        employee: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        project: {
          select: {
            id: true,
            titre: true,
          },
        },
      },
    });

    return result.map((item) => {
      const timesheet = timesheets.find(
        (t) => t.employeeId === item.employeeId && t.projectId === item.projectId
      );
      
      const totalHeures = (item._sum.regularHrs || 0) + 
                         (item._sum.overtimeHrs || 0) + 
                         (item._sum.sickHrs || 0) + 
                         (item._sum.vacationHrs || 0);
      
      return {
        employe: timesheet?.employee,
        projet: timesheet?.project,
        totalHeures,
        regularHrs: item._sum.regularHrs || 0,
        overtimeHrs: item._sum.overtimeHrs || 0,
        sickHrs: item._sum.sickHrs || 0,
        vacationHrs: item._sum.vacationHrs || 0,
      };
    });
  }
}

export const timesheetService = new TimesheetService();
