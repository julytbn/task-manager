import { prisma } from "@/lib/prisma";
import { Prisma, StatutDevis } from "@prisma/client";

/**
 * Service pour gérer les Devis (Quotations/Estimates)
 * Responsabilités:
 * - CRUD des devis
 * - Validation des statuts de devis
 * - Calcul du montant total avec TVA
 * - Gestion des services dans un devis
 */

export interface CreateDevisInput {
  clientId: string;
  titre?: string;
  description?: string;
  montant: number;
  tauxTVA?: number;
  notes?: string;
  services?: Array<{
    serviceId: string;
    quantite: number;
    prix?: number;
  }>;
}

export interface UpdateDevisInput {
  titre?: string;
  description?: string;
  montant?: number;
  tauxTVA?: number;
  notes?: string;
  statut?: StatutDevis;
}

export interface DevisWithServices {
  id: string;
  numero: string;
  clientId: string;
  titre: string | null;
  description: string | null;
  montant: number;
  tauxTVA: number;
  montantTotal: number;
  statut: StatutDevis;
  dateCreation: Date;
  dateEnvoi: Date | null;
  dateAccept: Date | null;
  dateRefus: Date | null;
  notes: string | null;
  dateModification: Date;
  services: Array<{
    id: string;
    devisId: string;
    serviceId: string;
    quantite: number;
    prix: number | null;
    dateAjout: Date;
  }>;
  client: {
    id: string;
    nom: string;
    prenom: string;
    email?: string | null;
    entreprise?: string | null;
  };
}

class DevisService {
  /**
   * Créer un nouveau devis
   */
  async createDevis(input: CreateDevisInput): Promise<DevisWithServices> {
    const { services = [], ...devisData } = input;

    // Générer un numéro de devis unique
    const numero = await this.generateDevisNumber();

    // Calculer le montant total si non fourni
    let montant = input.montant || 0;
    let tauxTVA = input.tauxTVA ?? 0.2; // 20% par défaut

    // Si des services sont fournis, calculer le montant total
    if (services.length > 0) {
      const servicesWithPrices = await Promise.all(
        services.map(async (s) => {
          const service = await prisma.service.findUnique({
            where: { id: s.serviceId },
          });
          return {
            ...s,
            prix: s.prix ?? service?.prix ?? 0, // Utilisation de prix au lieu de prixUnitaire
          };
        })
      );

      montant = servicesWithPrices.reduce(
        (sum, s) => sum + (s.prix || 0) * s.quantite,
        0
      );
    }

    const montantTotal = montant * (1 + tauxTVA);

    // Créer le devis avec les services associés
    const devis = await prisma.devis.create({
      data: {
        ...devisData,
        numero,
        montant,
        tauxTVA,
        montantTotal,
        statut: 'BROUILLON',
        services: {
          create: services.map((s) => ({
            service: {
              connect: { id: s.serviceId }
            },
            quantite: s.quantite,
            prix: s.prix,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true
          }
        },
        client: true,
      },
    });

    // Formater la réponse pour correspondre au type DevisWithServices
    const formattedDevis = {
      ...devis,
      services: devis.services.map(s => ({
        id: s.id,
        devisId: s.devisId,
        serviceId: s.serviceId,
        quantite: s.quantite,
        prix: s.prix,
        dateAjout: s.dateAjout,
        service: s.service
      }))
    };

    return formattedDevis as unknown as DevisWithServices;
  }

  /**
   * Récupérer tous les devis
   */
  async getAllDevis(filters?: {
    clientId?: string;
    statut?: StatutDevis;
    skip?: number;
    take?: number;
  }): Promise<DevisWithServices[]> {
    return prisma.devis.findMany({
      where: {
        clientId: filters?.clientId,
        statut: filters?.statut,
      },
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
      skip: filters?.skip || 0,
      take: filters?.take || 50,
      orderBy: { dateCreation: "desc" },
    });
  }

  /**
   * Récupérer un devis par ID
   */
  async getDevisById(id: string): Promise<DevisWithServices | null> {
    return prisma.devis.findUnique({
      where: { id },
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un devis par numéro
   */
  async getDevisByNumero(numero: string): Promise<DevisWithServices | null> {
    return prisma.devis.findUnique({
      where: { numero },
      include: {
        services: true,
        client: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            entreprise: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un devis
   */
  async updateDevis(id: string, input: UpdateDevisInput): Promise<DevisWithServices> {
    const currentDevis = await this.getDevisById(id);
    if (!currentDevis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    const montant = input.montant || currentDevis.montant;
    const tauxTVA = input.tauxTVA !== undefined ? input.tauxTVA : currentDevis.tauxTVA;
    const montantTotal = montant + montant * tauxTVA;

    await prisma.devis.update({
      where: { id },
      data: {
        titre: input.titre,
        description: input.description,
        montant,
        tauxTVA,
        montantTotal,
        notes: input.notes,
        statut: input.statut,
        dateModification: new Date(),
      },
    });

    return this.getDevisById(id) as Promise<DevisWithServices>;
  }

  /**
   * Valider un devis (BROUILLON → ENVOYE)
   */
  async sendDevis(id: string): Promise<DevisWithServices> {
    const devis = await this.getDevisById(id);
    if (!devis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    if (devis.statut !== "BROUILLON") {
      throw new Error(`Devis must be in BROUILLON status to be sent. Current status: ${devis.statut}`);
    }

    await prisma.devis.update({
      where: { id },
      data: {
        statut: "ENVOYE",
        dateEnvoi: new Date(),
      },
    });

    return this.getDevisById(id) as Promise<DevisWithServices>;
  }

  /**
   * Accepter un devis (ENVOYE/BROUILLON → ACCEPTE)
   */
  async acceptDevis(id: string): Promise<DevisWithServices> {
    const devis = await this.getDevisById(id);
    if (!devis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    if (!["ENVOYE", "BROUILLON"].includes(devis.statut)) {
      throw new Error(`Devis cannot be accepted from status: ${devis.statut}`);
    }

    await prisma.devis.update({
      where: { id },
      data: {
        statut: "ACCEPTE",
        dateAccept: new Date(),
      },
    });

    return this.getDevisById(id) as Promise<DevisWithServices>;
  }

  /**
   * Refuser un devis (ENVOYE → REFUSE)
   */
  async refuseDevis(id: string): Promise<DevisWithServices> {
    const devis = await this.getDevisById(id);
    if (!devis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    if (!["ENVOYE", "BROUILLON", "ACCEPTE"].includes(devis.statut)) {
      throw new Error(`Devis cannot be refused from status: ${devis.statut}`);
    }

    await prisma.devis.update({
      where: { id },
      data: {
        statut: "REFUSE",
        dateRefus: new Date(),
      },
    });

    return this.getDevisById(id) as Promise<DevisWithServices>;
  }

  /**
   * Annuler un devis
   */
  async cancelDevis(id: string): Promise<DevisWithServices> {
    const devis = await this.getDevisById(id);
    if (!devis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    await prisma.devis.update({
      where: { id },
      data: {
        statut: "ANNULE",
      },
    });

    return this.getDevisById(id) as Promise<DevisWithServices>;
  }

  /**
   * Ajouter un service à un devis
   */
  async addServiceToDevis(
    devisId: string,
    serviceId: string,
    quantite: number = 1,
    prix?: number
  ): Promise<{
    id: string;
    devisId: string;
    serviceId: string;
    quantite: number;
    prix: number | null;
    dateAjout: Date;
  }> {
    const devis = await this.getDevisById(devisId);
    if (!devis) {
      throw new Error(`Devis with ID ${devisId} not found`);
    }

    return prisma.devisService.create({
      data: {
        devisId,
        serviceId,
        quantite,
        prix,
      },
    });
  }

  /**
   * Retirer un service d'un devis
   */
  async removeServiceFromDevis(devisServiceId: string): Promise<void> {
    await prisma.devisService.delete({
      where: { id: devisServiceId },
    });
  }

  /**
   * Supprimer un devis
   */
  async deleteDevis(id: string): Promise<void> {
    const devis = await this.getDevisById(id);
    if (!devis) {
      throw new Error(`Devis with ID ${id} not found`);
    }

    // Cascade delete through relation
    await prisma.devis.delete({
      where: { id },
    });
  }

  /**
   * Générer un numéro unique pour un devis
   * Format: DEV-YYYY-MM-DDTHHMMSS
   */
  private async generateDevisNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const baseNumber = `DEV-${year}-${month}-${day}T${hours}${minutes}${seconds}`;

    // Vérifier l'unicité
    let numero = baseNumber;
    let counter = 1;
    let existing = await prisma.devis.findUnique({
      where: { numero },
    });

    while (existing) {
      numero = `${baseNumber}-${counter}`;
      counter++;
      existing = await prisma.devis.findUnique({
        where: { numero },
      });
    }

    return numero;
  }
}

export const devisService = new DevisService();
