// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { useToast } from '@/hooks/use-toast';
// import { UserForm } from './user-form';
// import { Plus } from 'lucide-react';
// import { API_URL } from '@/lib/config';

// interface User {
//     id: number;
//     username: string;
//     email: string;
//     firstName: string;
//     lastName: string;
//     phone: string;
//     address: string;
//     role: 'admin' | 'purchasing' | 'sales';
//     is_verified: boolean;
//     is_staff: boolean;
//     is_superuser: boolean;
//     telephone: string;
//     adresse: string;
//     dateInscription: string;
//     type: string;
//     totalCommandes: number;
//     montantTotal: number;
//     derniereCommande: string;
// }

// export function UsersList() {
//     const router = useRouter();
//     const { toast } = useToast();

//     const [users, setUsers] = useState<User[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'purchasing'>('all');
//     const [isDialogOpen, setIsDialogOpen] = useState(false);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     useEffect(() => {
//         const fetchUsers = async () => {
//             try {
//                 setLoading(true);
//                 const token = localStorage.getItem('access_token');
//                 const url =
//                     activeTab === 'all'
//                         ? `${API_URL}/accounts/admin/staff-users/`
//                         : `${API_URL}/accounts/admin/staff-users/?role=${activeTab}`;

//                 console.log('Fetching users from:', url);
//                 const response = await fetch(url, {
//                     headers: {
//                         'Authorization': `Bearer ${token}`,
//                         'Content-Type': 'application/json',
//                     },
//                 });

//                 if (!response.ok) {
//                     const errorText = await response.text();
//                     console.error('Error response:', errorText);
//                     throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
//                 }
//                 console.log("response", response)
//                 const data = await response.json();
//                 console.log('Users data received:', data);

//                 // Get users from the response data
//                 const usersData = Array.isArray(data) ? data : (data.users || []);
//                 console.log('Processed users:', usersData);

//                 // Map the data to match our User interface
//                 const formattedUsers = usersData.map((user: any) => {
//                     console.log('Raw user data:', user); // Debug log
//                     return {
//                         ...user,
//                         role: user.role, // Ensure role has a default value
//                         firstName: user.firstName || user.first_name || user.email?.split('@')[0] || 'Utilisateur',
//                         lastName: user.lastName || user.last_name || '',
//                     };
//                 });

//                 setUsers(formattedUsers);
//             } catch (err) {
//                 const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
//                 console.error('Error fetching users:', errorMessage, err);
//                 setError(errorMessage);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchUsers();
//     }, [activeTab]);

//     const getRoleBadge = (role: string) => {
//         const roleMap = {
//             admin: { label: 'Admin', variant: 'destructive' as const },
//             purchasing: { label: 'Achats', variant: 'secondary' as const },
//             sales: { label: 'Ventes', variant: 'default' as const },
//         };

//         const roleKey = role.toLowerCase() as keyof typeof roleMap;
//         const { label, variant } = roleMap[roleKey] || { label: role, variant: 'outline' as const };

//         return <Badge variant={variant}>{label}</Badge>;
//     };

//     const handleCreateUser = async (data: any) => {
//         try {
//             setIsSubmitting(true);
//             const token = localStorage.getItem('access_token');
//             const response = await fetch(`${API_URL}/accounts/admin/create-user/`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({
//                     ...data,
//                     username: data.email,
//                 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.detail || 'Failed to create user');
//             }

//             toast({
//                 title: 'Success',
//                 description: 'User created successfully',
//             });

//             setIsDialogOpen(false);

//             const usersResponse = await fetch(`${API_URL}/accounts/admin/staff-users/`, {
//                 headers: { 'Authorization': `Bearer ${token}` },
//             });

//             const usersData = await usersResponse.json();
//             setUsers(usersData.users);
//         } catch (error) {
//             console.error('Error creating user:', error);
//             toast({
//                 title: 'Error',
//                 description: error instanceof Error ? error.message : 'Failed to create user',
//                 variant: 'destructive',
//             });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     if (loading) return <div className="p-4">Chargement des utilisateurs...</div>;
//     if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;

//     return (
//         <Card className="w-full">
//             <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-2xl font-bold">Gestion des Utilisateurs</CardTitle>
//                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                     <DialogTrigger asChild>
//                         <Button>
//                             <Plus className="mr-2 h-4 w-4" />
//                             Ajouter un utilisateur
//                         </Button>
//                     </DialogTrigger>
//                     <DialogContent className="sm:max-w-[600px]">
//                         <DialogHeader>
//                             <DialogTitle>Nouvel Utilisateur</DialogTitle>
//                         </DialogHeader>
//                         <UserForm onSubmit={handleCreateUser} isLoading={isSubmitting} />
//                     </DialogContent>
//                 </Dialog>
//             </CardHeader>

//             <CardContent>
//                 <Tabs
//                     value={activeTab}
//                     onValueChange={(value) => setActiveTab(value as 'all' | 'sales' | 'purchasing')}
//                     className="w-full"
//                 >
//                     <TabsList className="grid w-full grid-cols-3 mb-6">
//                         <TabsTrigger value="all">Tous</TabsTrigger>
//                         <TabsTrigger value="sales">Ventes</TabsTrigger>
//                         <TabsTrigger value="purchasing">Achats</TabsTrigger>
//                     </TabsList>

//                     <TabsContent value={activeTab}>
//                         <div className="rounded-md border">
//                             <Table>
//                                 <TableHeader>
//                                     <TableRow>
//                                         <TableHead>Nom</TableHead>
//                                         <TableHead>Email</TableHead>
//                                         <TableHead>Rôle</TableHead>
//                                         <TableHead>Statut</TableHead>
//                                     </TableRow>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {users.length > 0 ? (
//                                         users.map((user) => (
//                                             <TableRow key={user.id}>
//                                                 <TableCell className="font-medium">
//                                                     {user.firstName} {user.lastName}
//                                                 </TableCell>
//                                                 <TableCell>{user.email}</TableCell>
//                                                 <TableCell>{getRoleBadge(user.role)}</TableCell>
//                                                 <TableCell>
//                                                     <Badge variant={user.is_verified ? 'default' : 'outline'}>
//                                                         {user.is_verified ? 'Vérifié' : 'En attente'}
//                                                     </Badge>
//                                                 </TableCell>
//                                             </TableRow>
//                                         ))
//                                     ) : (
//                                         <TableRow>
//                                             <TableCell colSpan={5} className="text-center py-4">
//                                                 Aucun utilisateur trouvé
//                                             </TableCell>
//                                         </TableRow>
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </TabsContent>
//                 </Tabs>
//             </CardContent>
//         </Card>
//     );
// }


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserForm } from './user-form';
import { Plus, Pencil, Trash2, Power, KeyRound, Eye, EyeOff, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { API_URL } from '@/lib/config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    role: 'admin' | 'purchasing' | 'sales';
    is_verified: boolean;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    telephone: string;
    adresse: string;
    dateInscription: string;
    type: string;
    totalCommandes: number;
    montantTotal: number;
    derniereCommande: string;
    plain_password: string;
}

const PWD_STORE_KEY = 'pneushop_staff_passwords';

function loadStoredPasswords(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(PWD_STORE_KEY) || '{}'); } catch { return {}; }
}

function saveStoredPassword(email: string, pwd: string) {
    const store = loadStoredPasswords();
    store[email] = pwd;
    localStorage.setItem(PWD_STORE_KEY, JSON.stringify(store));
}

export function UsersList() {
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'purchasing'>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [passwordUser, setPasswordUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [settingPassword, setSettingPassword] = useState(false);
    const [revealedPwdUserId, setRevealedPwdUserId] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const url = activeTab === 'all'
                ? `${API_URL}/accounts/admin/staff-users/`
                : `${API_URL}/accounts/admin/staff-users/?role=${activeTab}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const usersData = Array.isArray(data) ? data : (data.users || []);
            const storedPwds = loadStoredPasswords();
            const formattedUsers = usersData.map((user: any) => ({
                ...user,
                role: user.role || 'sales',
                firstName: user.firstName || user.first_name || user.email?.split('@')[0] || 'Utilisateur',
                lastName: user.lastName || user.last_name || '',
                plain_password: storedPwds[user.email] || user.plain_password || '',
            }));

            setUsers(formattedUsers);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            console.error('Error fetching users:', errorMessage, err);
            setError(errorMessage);
            toast({
                title: 'Error',
                description: 'Failed to load users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (data: any) => {
        if (editingUser) {
            await handleUpdateUser(data);
        } else {
            await handleCreateUser(data);
        }
    };

    const handleUpdateUser = async (userData: any) => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/accounts/admin/update-user/${editingUser?.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...userData,
                    role: userData.role || editingUser?.role,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }

            toast({
                title: 'Success',
                description: 'User updated successfully',
            });

            setIsDialogOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update user',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/accounts/admin/delete-user/${userToDelete.id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            toast({
                title: 'Success',
                description: 'User deleted successfully',
            });

            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete user',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetPassword = async () => {
        if (!passwordUser || !newPassword) return;
        setSettingPassword(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/accounts/admin/update-user/${passwordUser.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: newPassword }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Erreur');
            const savedPwd = newPassword;
            const savedEmail = passwordUser.email;
            // Persister par email dans localStorage → survie au refresh
            saveStoredPassword(savedEmail, savedPwd);
            setPasswordUser(null);
            setNewPassword("");
            // Mettre à jour tous les users ayant cet email
            setUsers(prev => prev.map(u => u.email === savedEmail ? { ...u, plain_password: savedPwd } : u));
            setRevealedPwdUserId(passwordUser.id);
            toast({ title: 'Mot de passe mis à jour', description: `Nouveau mot de passe défini` });
        } catch (e: any) {
            toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
        } finally { setSettingPassword(false); }
    };

    const handleToggleActive = async (user: User) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_URL}/accounts/admin/toggle-user/${user.id}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Erreur');
            const data = await res.json();
            toast({
                title: data.is_active ? 'Compte activé' : 'Compte désactivé',
                description: `${user.email} ${data.is_active ? 'est maintenant actif' : 'a été désactivé'}`,
            });
            fetchUsers();
        } catch {
            toast({ title: 'Erreur', description: 'Impossible de modifier le statut', variant: 'destructive' });
        }
    };

    const getRoleBadge = (role: string) => {
        const roleMap: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'default' | 'outline'; className?: string }> = {
            admin: { label: 'Administrateur', variant: 'destructive', className: 'bg-[#9B2226] hover:bg-[#9B2226] border-[#9B2226]' },
            purchasing: { label: 'Resp. Achat', variant: 'secondary' },
            sales: { label: 'Resp. Vente', variant: 'default' },
        };

        const roleKey = role.toLowerCase() as keyof typeof roleMap;
        const { label, variant, className } = roleMap[roleKey] || { label: role, variant: 'outline' as const };

        return <Badge variant={variant} className={className}>{label}</Badge>;
    };

    const handleCreateUser = async (data: any) => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/accounts/admin/create-user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...data,
                    username: data.email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create user');
            }

            toast({
                title: 'Success',
                description: 'User created successfully',
            });

            setIsDialogOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create user',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-4">Chargement des utilisateurs...</div>;
    if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-2xl font-bold">Gestion des Utilisateurs</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingUser(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un utilisateur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
                            </DialogTitle>
                        </DialogHeader>
                        <UserForm
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                            initialData={editingUser || undefined}
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent>
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'all' | 'sales' | 'purchasing')}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="sales">Ventes</TabsTrigger>
                        <TabsTrigger value="purchasing">Achats</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Mot de passe</TableHead>
                                        <TableHead>Rôle</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    {user.firstName} {user.lastName}
                                                </TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm tracking-widest">
                                                            {revealedPwdUserId === user.id && user.plain_password
                                                                ? <span className="text-green-700 font-bold">{user.plain_password}</span>
                                                                : "••••••••"}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-gray-400 hover:text-gray-700"
                                                            onClick={() => {
                                                                if (user.plain_password) {
                                                                    setRevealedPwdUserId(revealedPwdUserId === user.id ? null : user.id);
                                                                } else {
                                                                    // Pas de mdp stocké → ouvrir le dialog pour en définir un
                                                                    setPasswordUser(user);
                                                                    setNewPassword("");
                                                                    setShowNewPwd(false);
                                                                }
                                                            }}
                                                            title={user.plain_password
                                                                ? (revealedPwdUserId === user.id ? "Masquer" : "Voir le mot de passe")
                                                                : "Définir le mot de passe"}
                                                        >
                                                            {revealedPwdUserId === user.id && user.plain_password
                                                                ? <EyeOff className="h-3.5 w-3.5" />
                                                                : <Eye className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.is_active !== false ? 'default' : 'outline'}
                                                        className={user.is_active !== false ? 'bg-brand-gold-light text-brand-gold-dark' : 'bg-brand-red-light text-brand-red'}>
                                                        {user.is_active !== false ? 'Actif' : 'Désactivé'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            title={user.is_active !== false ? 'Désactiver' : 'Activer'}
                                                            onClick={() => handleToggleActive(user)}
                                                        >
                                                            <Power className={`h-4 w-4 ${user.is_active !== false ? 'text-brand-gold' : 'text-gray-400'}`} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            title="Définir un nouveau mot de passe"
                                                            onClick={() => { setPasswordUser(user); setNewPassword(""); setShowNewPwd(false); }}
                                                        >
                                                            <KeyRound className="h-4 w-4 text-brand-blue" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                                                            <Trash2 className="h-4 w-4 text-brand-red" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                Aucun utilisateur trouvé
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Dialog : définir nouveau mot de passe */}
            <AlertDialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-brand-blue" />
                            Nouveau mot de passe
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Définir un nouveau mot de passe pour <strong>{passwordUser?.email}</strong>.<br />
                            <span className="text-xs text-gray-400">Le mot de passe actuel ne peut pas être affiché (sécurité).</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="relative mt-2">
                        <Input
                            type={showNewPwd ? "text" : "password"}
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                        >
                            {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPasswordUser(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSetPassword}
                            disabled={settingPassword || !newPassword}
                            className="bg-brand-blue hover:bg-brand-blue-dark text-white"
                        >
                            {settingPassword ? 'Enregistrement...' : 'Enregistrer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cela supprimera définitivement l'utilisateur.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={isSubmitting}
                            className="bg-[#9B2226] hover:bg-[#730019]"
                        >
                            {isSubmitting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}