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
import { useToast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRoleAccess } from '@/hooks/use-role-access';
import { Loader2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
}

interface LocationError {
  name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    street_address: '',
    city: '',
    state: '',
    country: '',
  });
  const [errors, setErrors] = useState<LocationError>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const { permissions, isLoading: isLoadingPermissions } = useRoleAccess();

  const canCreate = permissions?.locations?.create || false;
  const canUpdate = permissions?.locations?.update || false;
  const canDelete = permissions?.locations?.delete || false;

  const validateLocation = () => {
    const newErrors: LocationError = {};
    if (!newLocation.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error fetching locations',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateLocation = async () => {
    if (!canCreate) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to create locations',
        variant: 'destructive',
      });
      return;
    }

    if (!validateLocation()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      const locationData = {
        name: newLocation.name,
        street_address: newLocation.street_address || null,
        city: newLocation.city || null,
        state: newLocation.state || null,
        country: newLocation.country || null,
        organization_id: user.id
      };

      const { error } = await supabase
        .from('locations')
        .insert([locationData]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Location created successfully',
      });

      setNewLocation({
        name: '',
        street_address: '',
        city: '',
        state: '',
        country: '',
      });
      setErrors({});
      setIsOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast({
        title: 'Error creating location',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!canUpdate) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to update locations',
        variant: 'destructive',
      });
      return;
    }

    if (!validateLocation()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!editingLocation) {
        throw new Error('No location selected for editing');
      }

      const { error } = await supabase
        .from('locations')
        .update({
          name: newLocation.name,
          street_address: newLocation.street_address || null,
          city: newLocation.city || null,
          state: newLocation.state || null,
          country: newLocation.country || null,
        })
        .eq('id', editingLocation.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });

      setNewLocation({
        name: '',
        street_address: '',
        city: '',
        state: '',
        country: '',
      });
      setEditingLocation(null);
      setIsOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error updating location',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!canDelete) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete locations',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsDeleting(id);
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });

      fetchLocations();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error deleting location',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const startEditing = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      street_address: location.street_address || '',
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
    });
    setIsOpen(true);
  };

  if (isLoading || isLoadingPermissions) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Locations</h1>
        {canCreate && (
          <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingLocation(null);
              setNewLocation({
                name: '',
                street_address: '',
                city: '',
                state: '',
                country: '',
              });
            }
            setIsOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>Add Location</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLocation ? 'Edit' : 'Add New'} Location</DialogTitle>
                <DialogDescription>
                  {editingLocation ? 'Update' : 'Create'} a location. Only name is required.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newLocation.name}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, name: e.target.value })
                    }
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    value={newLocation.street_address}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, street_address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newLocation.city}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newLocation.state}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newLocation.country}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, country: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={editingLocation ? handleUpdateLocation : handleCreateLocation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingLocation ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingLocation ? 'Update Location' : 'Create Location'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {locations.length === 0 && !isLoading ? (
        <div className="text-center py-10 text-gray-500">
          No locations found. {canCreate && 'Click "Add Location" to create one.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle>{location.name}</CardTitle>
                {location.street_address && (
                  <CardDescription>{location.street_address}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {location.city && <p>{location.city}</p>}
                  {location.state && <p>{location.state}</p>}
                  {location.country && <p>{location.country}</p>}
                </div>
                <div className="flex space-x-2 mt-4">
                  {canUpdate && (
                    <Button
                      variant="outline"
                      onClick={() => startEditing(location)}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteLocation(location.id)}
                      disabled={isDeleting === location.id}
                    >
                      {isDeleting === location.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
