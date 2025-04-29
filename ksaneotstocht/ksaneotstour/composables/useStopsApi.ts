// composables/useStopsApi.ts
import type { Stop, StopFormData } from '~/types/';

export const useStopsApi = () => {

  const getActiveStops = async (): Promise<Stop[]> => {
    try {
      const data = await $fetch<Stop[]>('/api/stops/active');
      return data ?? [];
    } catch (error) {
      console.error("Error fetching active stops:", error);
      // Handle error appropriately, maybe return empty array or throw
      return [];
    }
  };

  const getAllStops = async (): Promise<Stop[]> => {
      // Needs authentication cookie to be sent automatically by browser
       try {
           const data = await $fetch<Stop[]>('/api/admin/stops');
           return data ?? [];
       } catch (error) {
           console.error("Error fetching all stops:", error);
           // Handle potential 403 Forbidden etc.
           return [];
       }
  };

  const createStop = async (formData: StopFormData): Promise<Stop> => {
     try {
        return await $fetch<Stop>('/api/admin/stops', {
            method: 'POST',
            body: formData,
        });
     } catch (error) {
         console.error("Error creating stop:", error);
         throw error; // Re-throw for component to handle
     }
  };

   const updateStop = async (id: number, formData: Partial<StopFormData>): Promise<Stop> => {
       try {
           return await $fetch<Stop>(`/api/admin/stops/${id}`, {
               method: 'PATCH', // or PUT
               body: formData,
           });
       } catch (error) {
           console.error(`Error updating stop ${id}:`, error);
           throw error; // Re-throw
       }
   };

    const deleteStop = async (id: number): Promise<void> => {
        try {
            await $fetch(`/api/admin/stops/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error(`Error deleting stop ${id}:`, error);
            throw error; // Re-throw
        }
    };

     const toggleStopStatus = async (id: number, isDisabled: boolean): Promise<Stop> => {
         try {
             return await $fetch<Stop>(`/api/admin/stops/${id}`, {
                 method: 'PATCH',
                 body: { is_manually_disabled: isDisabled },
             });
         } catch (error) {
             console.error(`Error toggling stop ${id}:`, error);
             throw error; // Re-throw
         }
     };


  return {
    getActiveStops,
    getAllStops,
    createStop,
    updateStop,
    deleteStop,
    toggleStopStatus,
  };
};