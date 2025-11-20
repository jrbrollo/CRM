/**
 * Edit Contact Dialog
 *
 * Modal dialog for editing existing contacts.
 * Pre-populates with current contact data and validates changes.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateContact } from '@/lib/hooks/useContacts';
import type { Contact, ContactStatus } from '@/lib/types/contact.types';
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

const editContactSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'customer']),
  leadScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

type EditContactFormData = z.infer<typeof editContactSchema>;

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
}: EditContactDialogProps) {
  const updateContact = useUpdateContact();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema),
    defaultValues: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      jobTitle: contact.position || '',
      status: contact.status,
      leadScore: contact.leadScore || 0,
      notes: contact.notes || '',
      address: contact.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    },
  });

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        jobTitle: contact.position || '',
        status: contact.status,
        leadScore: contact.leadScore || 0,
        notes: contact.notes || '',
        address: contact.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      });
    }
  }, [contact, reset]);

  const onSubmit = async (data: EditContactFormData) => {
    try {
      await updateContact.mutateAsync({
        contactId: contact.id,
        data: {
          ...data,
          position: data.jobTitle,
        },
      });

      onOpenChange(false);
      toast.success('Contato atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erro ao atualizar contato');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contato</DialogTitle>
          <DialogDescription>
            Atualize as informações deste contato
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
                <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">
                Sobrenome <span className="text-destructive">*</span>
              </Label>
              <Input id="lastName" placeholder="Silva" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@empresa.com"
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

          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="Empresa ABC" {...register('company')} />
            </div>

            <div>
              <Label htmlFor="jobTitle">Cargo</Label>
              <Input id="jobTitle" placeholder="Gerente de Vendas" {...register('jobTitle')} />
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
                onValueChange={(value: ContactStatus) => setValue('status', value)}
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
                placeholder="50"
                {...register('leadScore', { valueAsNumber: true })}
              />
              {errors.leadScore && (
                <p className="text-sm text-destructive mt-1">{errors.leadScore.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <Label>Endereço</Label>

            <Input
              placeholder="Rua"
              {...register('address.street')}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input placeholder="Cidade" {...register('address.city')} />
              <Input placeholder="Estado" {...register('address.state')} />
              <Input placeholder="CEP" {...register('address.zipCode')} />
            </div>

            <Input placeholder="País" {...register('address.country')} />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Anotações importantes sobre este contato..."
              rows={4}
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
            )}
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
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
