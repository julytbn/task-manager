/**
 * Sécurité - Rate limiting et validation des requêtes
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration du rate limiting simple (à remplacer par redis en production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requêtes par fenêtre
  loginMaxRequests: 5, // 5 tentatives de connexion
  loginWindowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Vérifier le rate limiting pour une IP
 */
export function checkRateLimit(ip: string, maxRequests: number = RATE_LIMIT_CONFIG.maxRequests): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    // Nouvelle fenêtre
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Limite atteinte
  }

  record.count++;
  return true;
}

/**
 * Nettoyer les enregistrements expirés
 */
export function cleanupRateLimitRecords() {
  const now = Date.now();
  const ips = Array.from(requestCounts.keys());
  for (const ip of ips) {
    const record = requestCounts.get(ip);
    if (record && now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Nettoyer toutes les heures
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitRecords, 60 * 60 * 1000);
}

/**
 * Extraire l'IP du client
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * Validation des entrées avec patterns de base
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-zA-Z0-9_-]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/,
};

/**
 * Validation basique des fichiers uploadés
 */
export const FILE_CONFIG = {
  ALLOWED_MIMES: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 5,
};

export function validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  if (!FILE_CONFIG.ALLOWED_MIMES.includes(mimeType)) {
    return { valid: false, error: `Type de fichier non autorisé: ${mimeType}` };
  }

  if (fileSize > FILE_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: `Fichier trop volumineux: ${fileSize} > ${FILE_CONFIG.MAX_FILE_SIZE}` };
  }

  return { valid: true };
}

/**
 * Middleware de sécurité - Headers de sécurité
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}
