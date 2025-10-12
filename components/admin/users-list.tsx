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
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
    is_staff: boolean;
    is_superuser: boolean;
    telephone: string;
    adresse: string;
    dateInscription: string;
    type: string;
    totalCommandes: number;
    montantTotal: number;
    derniereCommande: string;
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

            const formattedUsers = usersData.map((user: any) => ({
                ...user,
                role: user.role || 'sales',
                firstName: user.firstName || user.first_name || user.email?.split('@')[0] || 'Utilisateur',
                lastName: user.lastName || user.last_name || '',
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

    const getRoleBadge = (role: string) => {
        const roleMap = {
            admin: { label: 'Admin', variant: 'destructive' as const },
            purchasing: { label: 'Achats', variant: 'secondary' as const },
            sales: { label: 'Ventes', variant: 'default' as const },
        };

        const roleKey = role.toLowerCase() as keyof typeof roleMap;
        const { label, variant } = roleMap[roleKey] || { label: role, variant: 'outline' as const };

        return <Badge variant={variant}>{label}</Badge>;
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
                                        <TableHead>Rôle</TableHead>
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
                                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setUserToDelete(user)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4">
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
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}