import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Calculator } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Project {
  id?: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio_proyecto?: string;
  fecha_inicio_desarrollo?: string;
  fecha_fin_desarrollo?: string;
  fecha_inicio_pruebas?: string;
  fecha_fin_pruebas?: string;
  fecha_go_live_planeado?: string;
  fecha_go_live_real?: string;
  avance?: number;
  presupuesto_total?: number;
  company_id?: number;
  portfolio_id?: number;
  gerente_asignado_id?: string;
  lider_asignado_id?: string;
}

interface ProjectFormDialogProps {
  project?: Project | null;
  onSave: () => void;
  onCancel: () => void;
  companies: Array<{ id: number; nombre: string }>;
  portfolios: Array<{ id: number; nombre: string }>;
  users: Array<{ id: string; nombre: string }>;
}

// ✅ FUNCIONES DE FECHA CORREGIDAS - SIN TIMEZONE ISSUES
const formatDateForInput = (dateStr?: string): string => {
  if (!dateStr) return '';
  
  // Si viene del backend como "2026-06-04T00:00:00.000Z" o con timezone
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  
  // Si es formato ISO date, mantener tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  return dateStr;
};

const formatDateForAPI = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Si está en formato MM/DD/YYYY (del date picker), convertir a YYYY-MM-DD
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Si ya está en formato YYYY-MM-DD, mantener
  return dateStr;
};

export function ProjectFormDialog({ 
  project, 
  onSave, 
  onCancel, 
  companies, 
  portfolios, 
  users 
}: ProjectFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ INICIALIZAR CON FECHAS CORREGIDAS
  const [formData, setFormData] = useState<Project>({
    nombre: project?.nombre || '',
    descripcion: project?.descripcion || '',
    fecha_inicio_proyecto: formatDateForInput(project?.fecha_inicio_proyecto),
    fecha_inicio_desarrollo: formatDateForInput(project?.fecha_inicio_desarrollo),
    fecha_fin_desarrollo: formatDateForInput(project?.fecha_fin_desarrollo),
    fecha_inicio_pruebas: formatDateForInput(project?.fecha_inicio_pruebas),
    fecha_fin_pruebas: formatDateForInput(project?.fecha_fin_pruebas),
    fecha_go_live_planeado: formatDateForInput(project?.fecha_go_live_planeado),
    fecha_go_live_real: formatDateForInput(project?.fecha_go_live_real),
    avance: project?.avance || 0,
    presupuesto_total: project?.presupuesto_total || 0,
    company_id: project?.company_id,
    portfolio_id: project?.portfolio_id,
    gerente_asignado_id: project?.gerente_asignado_id || '',
    lider_asignado_id: project?.lider_asignado_id || ''
  });

  // ✅ ACTUALIZAR FORMDATA CUANDO CAMBIE EL PROYECTO
  useEffect(() => {
    if (project) {
      setFormData({
        nombre: project.nombre || '',
        descripcion: project.descripcion || '',
        fecha_inicio_proyecto: formatDateForInput(project.fecha_inicio_proyecto),
        fecha_inicio_desarrollo: formatDateForInput(project.fecha_inicio_desarrollo),
        fecha_fin_desarrollo: formatDateForInput(project.fecha_fin_desarrollo),
        fecha_inicio_pruebas: formatDateForInput(project.fecha_inicio_pruebas),
        fecha_fin_pruebas: formatDateForInput(project.fecha_fin_pruebas),
        fecha_go_live_planeado: formatDateForInput(project.fecha_go_live_planeado),
        fecha_go_live_real: formatDateForInput(project.fecha_go_live_real),
        avance: project.avance || 0,
        presupuesto_total: project.presupuesto_total || 0,
        company_id: project.company_id,
        portfolio_id: project.portfolio_id,
        gerente_asignado_id: project.gerente_asignado_id || '',
        lider_asignado_id: project.lider_asignado_id || ''
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
      
      console.log('🔍 API_URL detectado:', API_URL);
      console.log('📝 Datos del formulario antes de procesar:', formData);
      
      // ✅ CONVERTIR FECHAS AL FORMATO CORRECTO PARA LA API
      const dataToSend = {
        ...formData,
        fecha_inicio_proyecto: formatDateForAPI(formData.fecha_inicio_proyecto || ''),
        fecha_inicio_desarrollo: formatDateForAPI(formData.fecha_inicio_desarrollo || ''),
        fecha_fin_desarrollo: formatDateForAPI(formData.fecha_fin_desarrollo || ''),
        fecha_inicio_pruebas: formatDateForAPI(formData.fecha_inicio_pruebas || ''),
        fecha_fin_pruebas: formatDateForAPI(formData.fecha_fin_pruebas || ''),
        fecha_go_live_planeado: formatDateForAPI(formData.fecha_go_live_planeado || ''),
        fecha_go_live_real: formatDateForAPI(formData.fecha_go_live_real || '')
      };

      console.log('🚀 Enviando datos a la API:', dataToSend);

      const url = project?.id 
        ? `${API_URL}/api/projects/${project.id}`
        : `${API_URL}/api/projects`;
      
      const response = await fetch(url, {
        method: project?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error response:', errorData);
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta exitosa del servidor:', result);

      toast({
        title: "✅ Éxito",
        description: project?.id 
          ? "Proyecto actualizado correctamente - Los cambios son visibles inmediatamente" 
          : "Proyecto creado correctamente",
      });

      // ✅ CRÍTICO: LLAMAR onSave PARA REFRESCAR LA LISTA INMEDIATAMENTE
      onSave();

    } catch (error: any) {
      console.error('❌ Error completo:', error);
      toast({
        title: "Error",
        description: `Hubo un problema al guardar el proyecto: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [avanceValue, setAvanceValue] = useState(formData.avance || 0);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-gray-900">
          {project?.id ? 'Editar proyecto' : 'Crear nuevo proyecto'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Información básica */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
              Nombre del proyecto *
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              required
              className="w-full"
              placeholder="Ingrese el nombre del proyecto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className="w-full resize-none"
              placeholder="Describa brevemente el proyecto"
            />
          </div>
        </div>

        {/* Asignaciones */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Empresa</Label>
            <Select 
              value={formData.company_id?.toString() || ''} 
              onValueChange={(value) => handleInputChange('company_id', value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Portfolio</Label>
            <Select 
              value={formData.portfolio_id?.toString() || ''} 
              onValueChange={(value) => handleInputChange('portfolio_id', value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                    {portfolio.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Gerente</Label>
            <Select 
              value={formData.gerente_asignado_id || ''} 
              onValueChange={(value) => handleInputChange('gerente_asignado_id', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Líder</Label>
            <Select 
              value={formData.lider_asignado_id || ''} 
              onValueChange={(value) => handleInputChange('lider_asignado_id', value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progreso y presupuesto */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Avance: {avanceValue}%</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => {
                  const newAvance = Math.round(avanceValue);
                  setAvanceValue(newAvance);
                  handleInputChange('avance', newAvance);
                }}
              >
                <Calculator className="h-3 w-3 mr-1" />
                Calcular
              </Button>
            </div>
            <div className="px-4">
              <Slider
                value={[avanceValue]}
                onValueChange={(value) => {
                  setAvanceValue(value[0]);
                  handleInputChange('avance', value[0]);
                }}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="presupuesto_total" className="text-sm font-medium text-gray-700">
              Presupuesto Total
            </Label>
            <Input
              id="presupuesto_total"
              type="number"
              value={formData.presupuesto_total}
              onChange={(e) => handleInputChange('presupuesto_total', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* ✅ FECHAS CON FORMATO CORREGIDO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Fechas del Proyecto</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio_proyecto" className="text-sm font-medium text-gray-700">
                Inicio proyecto
              </Label>
              <Input
                id="fecha_inicio_proyecto"
                type="date"
                value={formData.fecha_inicio_proyecto}
                onChange={(e) => handleInputChange('fecha_inicio_proyecto', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio_desarrollo" className="text-sm font-medium text-gray-700">
                Inicio desarrollo
              </Label>
              <Input
                id="fecha_inicio_desarrollo"
                type="date"
                value={formData.fecha_inicio_desarrollo}
                onChange={(e) => handleInputChange('fecha_inicio_desarrollo', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_fin_desarrollo" className="text-sm font-medium text-gray-700">
                Fin desarrollo
              </Label>
              <Input
                id="fecha_fin_desarrollo"
                type="date"
                value={formData.fecha_fin_desarrollo}
                onChange={(e) => handleInputChange('fecha_fin_desarrollo', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio_pruebas" className="text-sm font-medium text-gray-700">
                Inicio pruebas
              </Label>
              <Input
                id="fecha_inicio_pruebas"
                type="date"
                value={formData.fecha_inicio_pruebas}
                onChange={(e) => handleInputChange('fecha_inicio_pruebas', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_fin_pruebas" className="text-sm font-medium text-gray-700">
                Fin pruebas
              </Label>
              <Input
                id="fecha_fin_pruebas"
                type="date"
                value={formData.fecha_fin_pruebas}
                onChange={(e) => handleInputChange('fecha_fin_pruebas', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_go_live_planeado" className="text-sm font-medium text-gray-700">
                Go Live planeado
              </Label>
              <Input
                id="fecha_go_live_planeado"
                type="date"
                value={formData.fecha_go_live_planeado}
                onChange={(e) => handleInputChange('fecha_go_live_planeado', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_go_live_real" className="text-sm font-medium text-gray-700">
                Go Live real
              </Label>
              <Input
                id="fecha_go_live_real"
                type="date"
                value={formData.fecha_go_live_real}
                onChange={(e) => handleInputChange('fecha_go_live_real', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '⏳ Guardando...' : '✅ Guardar cambios'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}