import { Controller, Get, Patch, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    return this.usersService.getAllUsers();
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    const updated = await this.usersService.updateUserRole(id, role);
    return {
      message: 'Permissão de usuário atualizada.',
      data: updated,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const success = await this.usersService.deleteUser(id);
    if (!success) {
      throw new HttpException('Falha ao excluir usuário.', HttpStatus.BAD_REQUEST);
    }
    return {
      message: 'Usuário excluído com sucesso.',
    };
  }
}
