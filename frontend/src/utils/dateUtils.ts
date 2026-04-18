// ========================================
// DATE UTILITIES - CONSISTENTE Y SIN TIMEZONE ISSUES
// Creado para PMO Portal - Fix definitivo fechas
// ========================================

/**
 * Formatea una fecha para mostrar en inputs date (YYYY-MM-DD)
 * Evita problemas de timezone que causan mostrar el día anterior
 */
export const formatDateForInput = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  
  try {
    // Si viene del backend con timestamp: "2026-06-04T00:00:00.000Z"
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    
    // Si es formato ISO date puro: "2026-06-04"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Si viene como objeto Date serializado
    if (dateStr instanceof Date || !isNaN(Date.parse(dateStr))) {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    }
    
    return dateStr;
  } catch (error) {
    console.warn('Error formatting date for input:', dateStr, error);
    return '';
  }
};

/**
 * Formatea fecha para enviar a la API (YYYY-MM-DD)
 * Convierte desde formatos de input hacia formato PostgreSQL
 */
export const formatDateForAPI = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // Si está en formato MM/DD/YYYY (de algunos date pickers)
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Si está en formato DD/MM/YYYY (formato europeo)
    if (dateStr.includes('/') && dateStr.split('/')[2].length === 4) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Si ya está en formato YYYY-MM-DD, mantener
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    return dateStr;
  } catch (error) {
    console.warn('Error formatting date for API:', dateStr, error);
    return dateStr;
  }
};

/**
 * Formatea fecha para mostrar al usuario (DD/MM/YYYY o formato local)
 * Usado en tablas, cards, etc.
 */
export const formatDateForDisplay = (dateStr?: string | null, locale: 'es' | 'en' = 'es'): string => {
  if (!dateStr) return '';
  
  try {
    const cleanDate = formatDateForInput(dateStr);
    if (!cleanDate) return '';
    
    const [year, month, day] = cleanDate.split('-');
    
    if (locale === 'es') {
      return `${day}/${month}/${year}`;
    } else {
      return `${month}/${day}/${year}`;
    }
  } catch (error) {
    console.warn('Error formatting date for display:', dateStr, error);
    return '';
  }
};

/**
 * Formatea fecha usando Intl.DateTimeFormat para mostrar en español
 * Ejemplo: "4 de junio de 2026"
 */
export const formatDateLong = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  
  try {
    const cleanDate = formatDateForInput(dateStr);
    if (!cleanDate) return '';
    
    // Crear fecha en UTC para evitar timezone shifts
    const [year, month, day] = cleanDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.warn('Error formatting long date:', dateStr, error);
    return '';
  }
};

/**
 * Convierte fecha a formato relativo ("hace 2 días", "en 5 días")
 */
export const formatDateRelative = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  
  try {
    const cleanDate = formatDateForInput(dateStr);
    if (!cleanDate) return '';
    
    const [year, month, day] = cleanDate.split('-');
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays > 0) return `En ${diffDays} días`;
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    
    return formatDateForDisplay(dateStr);
  } catch (error) {
    console.warn('Error formatting relative date:', dateStr, error);
    return formatDateForDisplay(dateStr);
  }
};

/**
 * Valida si una fecha es válida
 */
export const isValidDate = (dateStr?: string | null): boolean => {
  if (!dateStr) return false;
  
  try {
    const cleanDate = formatDateForInput(dateStr);
    if (!cleanDate) return false;
    
    const [year, month, day] = cleanDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return !isNaN(date.getTime()) && 
           date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getDate() === parseInt(day);
  } catch {
    return false;
  }
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calcula días entre dos fechas
 */
export const daysBetween = (startDate: string, endDate: string): number => {
  try {
    const start = formatDateForInput(startDate);
    const end = formatDateForInput(endDate);
    
    if (!start || !end) return 0;
    
    const [startYear, startMonth, startDay] = start.split('-');
    const [endYear, endMonth, endDay] = end.split('-');
    
    const startDateObj = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    const endDateObj = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
    
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

// ========================================
// EJEMPLOS DE USO
// ========================================

/*
// En componentes React:

import { formatDateForInput, formatDateForAPI, formatDateForDisplay } from '@/utils/dateUtils';

// Para inputs de formulario:
<input 
  type="date" 
  value={formatDateForInput(project.fecha_go_live_real)} 
  onChange={(e) => setProject({...project, fecha_go_live_real: e.target.value})} 
/>

// Para enviar a API:
const dataToSend = {
  ...formData,
  fecha_go_live_real: formatDateForAPI(formData.fecha_go_live_real)
};

// Para mostrar en tabla:
<td>{formatDateForDisplay(project.fecha_go_live_real)}</td>

// Para mostrar formato largo:
<p>Fecha programada: {formatDateLong(project.fecha_go_live_real)}</p>

*/