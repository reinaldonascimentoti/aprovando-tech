import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getAllUsers() {
    return this.supabaseService.getUsers();
  }

  async updateUserRole(id: string, role: string) {
    return this.supabaseService.updateUserRole(id, role);
  }

  async deleteUser(id: string) {
    return this.supabaseService.deleteUser(id);
  }
}
