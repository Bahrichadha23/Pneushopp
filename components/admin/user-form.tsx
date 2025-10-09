// 'use client';

// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Loader2 } from 'lucide-react';
// import { Controller } from "react-hook-form";

// const userFormSchema = z.object({
//     email: z.string().email('Email invalide'),
//     firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
//     lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
//     password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
//     password_confirm: z.string(),
//     role: z.enum(['sales', 'purchasing']),
// }).refine((data) => data.password === data.password_confirm, {
//     message: 'Les mots de passe ne correspondent pas',
//     path: ['password_confirm'],
// });

// type UserFormValues = z.infer<typeof userFormSchema>;

// interface UserFormProps {
//     onSubmit: (data: UserFormValues) => Promise<void>;
//     isLoading: boolean;
// }

// export function UserForm({ onSubmit, isLoading }: UserFormProps) {
//     const {
//         register,
//         handleSubmit,
//         control,
//         formState: { errors },
//         reset,
//     } = useForm<UserFormValues>({
//         resolver: zodResolver(userFormSchema),
//         defaultValues: {
//             role: 'sales',
//         },
//     });

//     return (
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                     <Label htmlFor="firstName">Prénom</Label>
//                     <Input
//                         id="firstName"
//                         {...register('firstName')}
//                         placeholder="Prénom"
//                         disabled={isLoading}
//                     />
//                     {errors.firstName && (
//                         <p className="text-sm text-red-500">{errors.firstName.message}</p>
//                     )}
//                 </div>

//                 <div className="space-y-2">
//                     <Label htmlFor="lastName">Nom</Label>
//                     <Input
//                         id="lastName"
//                         {...register('lastName')}
//                         placeholder="Nom"
//                         disabled={isLoading}
//                     />
//                     {errors.lastName && (
//                         <p className="text-sm text-red-500">{errors.lastName.message}</p>
//                     )}
//                 </div>
//             </div>

//             <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                     id="email"
//                     type="email"
//                     {...register('email')}
//                     placeholder="email@exemple.com"
//                     disabled={isLoading}
//                 />
//                 {errors.email && (
//                     <p className="text-sm text-red-500">{errors.email.message}</p>
//                 )}
//             </div>

//             <div className="space-y-2">
//                 <Label htmlFor="role">Rôle</Label>
//                 <Controller
//                     name="role"
//                     control={control}
//                     render={({ field }) => (
//                         <Select
//                             value={field.value}
//                             onValueChange={field.onChange}
//                             disabled={isLoading}
//                         >
//                             <SelectTrigger>
//                                 <SelectValue placeholder="Sélectionner un rôle" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="sales">Ventes</SelectItem>
//                                 <SelectItem value="purchasing">Achats</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     )}
//                 />
//                 {errors.role && (
//                     <p className="text-sm text-red-500">{errors.role.message}</p>
//                 )}
//             </div>


//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                     <Label htmlFor="password">Mot de passe</Label>
//                     <Input
//                         id="password"
//                         type="password"
//                         {...register('password')}
//                         placeholder="••••••••"
//                         disabled={isLoading}
//                     />
//                     {errors.password && (
//                         <p className="text-sm text-red-500">{errors.password.message}</p>
//                     )}
//                 </div>

//                 <div className="space-y-2">
//                     <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
//                     <Input
//                         id="password_confirm"
//                         type="password"
//                         {...register('password_confirm')}
//                         placeholder="••••••••"
//                         disabled={isLoading}
//                     />
//                     {errors.password_confirm && (
//                         <p className="text-sm text-red-500">
//                             {errors.password_confirm.message}
//                         </p>
//                     )}
//                 </div>
//             </div>

//             <div className="flex justify-end space-x-4 pt-4">
//                 <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => reset()}
//                     disabled={isLoading}
//                 >
//                     Réinitialiser
//                 </Button>
//                 <Button type="submit" disabled={isLoading}>
//                     {isLoading ? (
//                         <>
//                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                             Création...
//                         </>
//                     ) : (
//                         'Créer l\'utilisateur'
//                     )}
//                 </Button>
//             </div>
//         </form>
//     );
// }



'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

// Schema validation
// Update the schema to make fields required
const userFormSchema = z.object({
    email: z.string().min(1, 'Email est requis').email('Email invalide'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    password_confirm: z.string().min(1, 'La confirmation du mot de passe est requise'),
    role: z.enum(['sales', 'purchasing']),
}).refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
    onSubmit: (data: UserFormValues) => Promise<void>;
    isLoading: boolean;
}

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isValid },
        watch,
        reset,
        trigger
    } = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            password_confirm: '',
            role: 'sales'
        },
    });

    // Debug form values
    const formValues = watch();
    useEffect(() => {
        console.log('Form values:', formValues);
        console.log('Form errors:', errors);
    }, [formValues, errors]);

    const handleFormSubmit = async (data: UserFormValues) => {
        console.log('Form submission started with data:', data);
        try {
            await onSubmit(data);
            console.log('Form submitted successfully');
            reset({
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                password_confirm: '',
                role: 'sales'
            });
        } catch (error) {
            console.error('Form submission failed:', error);
            // Error is already handled in the parent component
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                        id="firstName"
                        {...register('firstName', { required: 'Le prénom est requis' })}
                        placeholder="Prénom"
                        disabled={isLoading}
                        className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                        <p className="text-sm text-red-500">{errors.firstName.message}</p>
                    )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                        id="lastName"
                        {...register('lastName', { required: 'Le nom est requis' })}
                        placeholder="Nom"
                        disabled={isLoading}
                        className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                        <p className="text-sm text-red-500">{errors.lastName.message}</p>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemple.com"
                    disabled={isLoading}
                    className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <Label>Rôle *</Label>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sales">Ventes</SelectItem>
                                <SelectItem value="purchasing">Achats</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.role && (
                    <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="password_confirm">Confirmer le mot de passe *</Label>
                    <Input
                        id="password_confirm"
                        type="password"
                        {...register('password_confirm')}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={errors.password_confirm ? 'border-red-500' : ''}
                    />
                    {errors.password_confirm && (
                        <p className="text-sm text-red-500">
                            {errors.password_confirm.message}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        reset();
                        // Trigger validation after reset
                        setTimeout(() => trigger(), 0);
                    }}
                    disabled={isLoading}
                >
                    Réinitialiser
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Création...
                        </>
                    ) : (
                        "Créer l'utilisateur"
                    )}
                </Button>
            </div>



        </form >
    );
}