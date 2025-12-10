// Déclarations de types globaux
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    // Ajoutez d'autres variables d'environnement ici
  }
}

// Déclaration pour les modules sans types
declare module '*.js' {
  const content: any;
  export default content;
}

// Types pour les résultats de Prisma
type PrismaPromise<T> = Promise<T>;

type DevisService = {
  id: string;
  devisId: string;
  serviceId: string;
  quantite: number;
  prix: number | null;
  dateAjout: Date;
};

type LogFunction = (message: string) => void;
