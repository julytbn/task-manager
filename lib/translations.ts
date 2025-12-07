export const translations = {
  fr: {
    // Header
    search: 'Rechercher...',
    notifications: 'Notifications',
    profile: 'Profil',
    logout: 'Déconnexion',
    
    // Settings page
    settings: 'Paramètres',
    settingsDescription: 'Gérez votre profil et vos préférences de sécurité',
    
    // Profile section
    personalInfo: 'Informations Personnelles',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    enterFirstName: 'Entrez votre prénom',
    enterLastName: 'Entrez votre nom',
    enterEmail: 'votre@email.com',
    update: 'Mettre à jour',
    updating: 'Mise à jour...',
    profileUpdated: 'Profil mis à jour avec succès',
    
    // Security section
    security: 'Sécurité',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    enterCurrentPassword: 'Entrez votre mot de passe actuel',
    enterNewPassword: 'Entrez votre nouveau mot de passe',
    confirmNewPassword: 'Confirmez votre nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    changingPassword: 'Changement...',
    passwordChanged: 'Mot de passe changé avec succès',
    passwordsNotMatch: 'Les mots de passe ne correspondent pas',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    invalidCurrentPassword: 'Le mot de passe actuel est incorrect',
    
    // Preferences section
    appearance: 'Apparence et Préférences',
    theme: 'Thème',
    chooseTheme: 'Choisissez votre thème préféré',
    dark: 'Sombre',
    light: 'Clair',
    palette: 'Palette Kekeli',
    paletteDescription: 'Utiliser la palette standard du dashboard',
    language: 'Langue',
    selectLanguage: 'Sélectionnez votre langue préférée',
    emailNotifications: 'Notifications par Email',
    emailNotificationsDescription: 'Recevoir des alertes et récapitulatifs',
    savePreferences: 'Sauvegarder les préférences',
    preferencesSaved: 'Préférences sauvegardées',
    
    // Errors
    error: 'Erreur lors de la mise à jour',
    passwordChangeError: 'Erreur lors du changement de mot de passe',
  },
  en: {
    // Header
    search: 'Search...',
    notifications: 'Notifications',
    profile: 'Profile',
    logout: 'Logout',
    
    // Settings page
    settings: 'Settings',
    settingsDescription: 'Manage your profile and security preferences',
    
    // Profile section
    personalInfo: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    enterFirstName: 'Enter your first name',
    enterLastName: 'Enter your last name',
    enterEmail: 'your@email.com',
    update: 'Update',
    updating: 'Updating...',
    profileUpdated: 'Profile updated successfully',
    
    // Security section
    security: 'Security',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    enterCurrentPassword: 'Enter your current password',
    enterNewPassword: 'Enter your new password',
    confirmNewPassword: 'Confirm your new password',
    changePassword: 'Change Password',
    changingPassword: 'Changing...',
    passwordChanged: 'Password changed successfully',
    passwordsNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    invalidCurrentPassword: 'Current password is incorrect',
    
    // Preferences section
    appearance: 'Appearance & Preferences',
    theme: 'Theme',
    chooseTheme: 'Choose your preferred theme',
    dark: 'Dark',
    light: 'Light',
    palette: 'Kekeli Palette',
    paletteDescription: 'Use the standard dashboard palette',
    language: 'Language',
    selectLanguage: 'Select your preferred language',
    emailNotifications: 'Email Notifications',
    emailNotificationsDescription: 'Receive alerts and summaries',
    savePreferences: 'Save Preferences',
    preferencesSaved: 'Preferences saved',
    
    // Errors
    error: 'Update error',
    passwordChangeError: 'Password change error',
  },
  es: {
    // Header
    search: 'Buscar...',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    logout: 'Cerrar sesión',
    
    // Settings page
    settings: 'Configuración',
    settingsDescription: 'Administra tu perfil y preferencias de seguridad',
    
    // Profile section
    personalInfo: 'Información Personal',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo Electrónico',
    enterFirstName: 'Ingresa tu nombre',
    enterLastName: 'Ingresa tu apellido',
    enterEmail: 'tu@email.com',
    update: 'Actualizar',
    updating: 'Actualizando...',
    profileUpdated: 'Perfil actualizado exitosamente',
    
    // Security section
    security: 'Seguridad',
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    enterCurrentPassword: 'Ingresa tu contraseña actual',
    enterNewPassword: 'Ingresa tu nueva contraseña',
    confirmNewPassword: 'Confirma tu nueva contraseña',
    changePassword: 'Cambiar Contraseña',
    changingPassword: 'Cambiando...',
    passwordChanged: 'Contraseña cambiada exitosamente',
    passwordsNotMatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    invalidCurrentPassword: 'La contraseña actual es incorrecta',
    
    // Preferences section
    appearance: 'Apariencia y Preferencias',
    theme: 'Tema',
    chooseTheme: 'Elige tu tema preferido',
    dark: 'Oscuro',
    light: 'Claro',
    palette: 'Paleta Kekeli',
    paletteDescription: 'Usar la paleta estándar del dashboard',
    language: 'Idioma',
    selectLanguage: 'Selecciona tu idioma preferido',
    emailNotifications: 'Notificaciones por Correo',
    emailNotificationsDescription: 'Recibir alertas y resúmenes',
    savePreferences: 'Guardar Preferencias',
    preferencesSaved: 'Preferencias guardadas',
    
    // Errors
    error: 'Error en la actualización',
    passwordChangeError: 'Error al cambiar la contraseña',
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.fr

export const t = (language: Language, key: TranslationKey): string => {
  return translations[language]?.[key] || key
}
