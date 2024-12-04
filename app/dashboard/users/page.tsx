'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { RBACGuard } from '@/components/ui/rbac-guard';
import { useRBAC } from '@/hooks/use-rbac';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  location_name?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Location {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserLocation, setNewUserLocation] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { checkPermission } = useRBAC();

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from('user_roles')
      .select(`
        user_id,
        roles:role_id(id, name),
        users:user_id(email, created_at),
        location_assignments!inner(
          locations:location_id(name)
        )
      `);

    const isAdmin = await checkPermission('users', 'read', 'all');
    const isManager = await checkPermission('users', 'read', 'team');

    if (!isAdmin) {
      if (isManager) {
        // First fetch the user IDs
        const { data: reportingUsers } = await supabase
          .from('reporting_relationships')
          .select('report_id')
          .eq('manager_id', session.user.id);

        const reportingUserIds = reportingUsers?.map(u => u.report_id) || [];
        query = query.in('user_id', reportingUserIds);
      } else {
        query = query.eq('user_id', session.user.id);
      }
    }

    const { data: usersData, error: usersError } = await query;

    if (usersError) {
      toast({
        title: 'Error fetching users',
        description: usersError.message,
        variant: 'destructive',
      });
      return;
    }

    const formattedUsers = usersData?.map((userData: any) => ({
      id: userData.user_id,
      email: userData.users.email,
      role: userData.roles.name,
      created_at: userData.users.created_at,
      location_name: userData.location_assignments[0]?.locations.name,
    }));

    setUsers(formattedUsers || []);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error fetching roles',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setRoles(data || []);
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error fetching locations',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setLocations(data || []);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error fetching groups',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setGroups(data || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchLocations();
    fetchGroups();
  }, []);

  const handleInviteUser = async () => {
    if (!newUserEmail || !newUserRole) {
      toast({
        title: 'Error',
        description: 'Email and role are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          roleName: newUserRole,
          groupIds: selectedGroups,
          locationId: newUserLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });

      setNewUserEmail('');
      setNewUserRole('');
      setSelectedGroups([]);
      setNewUserLocation('');
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(current =>
      current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId]
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Users</h1>
        <RBACGuard
          resource="users"
          action="create"
          fallback={
            <div className="text-sm text-gray-500">
              You don't have permission to create users
            </div>
          }
        >
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email to add a new user to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Enter user email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Groups</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-40 overflow-y-auto">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={() => toggleGroup(group.id)}
                        />
                        <label
                          htmlFor={`group-${group.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Select value={newUserLocation} onValueChange={setNewUserLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RBACGuard>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle>{user.email}</CardTitle>
              <CardDescription>
                Joined on {new Date(user.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Role:</span>
                  <span className="text-sm">{user.role}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{user.location_name}</span>
                </div>
                <RBACGuard
                  resource="users"
                  action="reset_password"
                  targetId={user.id}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-fit"
                    onClick={() => {/* Implement password reset */}}
                  >
                    Reset Password
                  </Button>
                </RBACGuard>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
