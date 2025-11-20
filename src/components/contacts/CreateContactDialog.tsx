/**
 * Create Contact Dialog
 *
 * Modal for creating new contacts with full validation.
 * Based on HubSpot's contact creation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateContact } from '@/lib/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const createContactSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'customer']),
  leadScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

type CreateContactFormData = z.infer<typeof createContactSchema>;

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({
  open,
  onOpenChange,
}: CreateContactDialogProps) {
  const { userDoc } = useAuth();
  const createContact = useCreateContact();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      status: 'new',
      leadScore: 0,
    },
  });

  const onSubmit = async (data: CreateContactFormData) => {
    try {
      if (!userDoc?.id) {
        toast.error('Você precisa estar logado');
        return;
      }

      const contactData = {
        ...data,
        ownerId: userDoc.id,
        ownerName: userDoc.name,
        tags: [],
        customFields: {},
      };

      await createContact.mutateAsync(contactData);
      
      reset();
      onOpenChange(false);
      toast.success('Contato criado com sucesso!');
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Erro ao criar contato');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
          <DialogDescription>
            Adicione um novo contato ao seu CRM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input id="firstName" placeholder="João" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">
                Sobrenome <span className="text-destructive">*</span>
              </Label>
              <Input id="lastName" placeholder="Silva" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 98765-4321"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Company and Job Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="Empresa XYZ" {...register('company')} />
            </div>
            <div>
              <Label htmlFor="jobTitle">Cargo</Label>
              <Input
                id="jobTitle"
                placeholder="Gerente de Vendas"
                {...register('jobTitle')}
              />
            </div>
          </div>

          {/* Status and Lead Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('status')}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="unqualified">Não Qualificado</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="leadScore">Lead Score (0-100)</Label>
              <Input
                id="leadScore"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                {...register('leadScore', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input placeholder="Rua" {...register('address.street')} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Cidade" {...register('address.city')} />
              <Input placeholder="Estado" {...register('address.state')} />
              <Input placeholder="CEP" {...register('address.zipCode')} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione notas sobre este contato..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Contato'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
