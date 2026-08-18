import { Controller, Get, Post, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { UserSchedulesService } from './user-schedules.service';

@Controller('api/user-schedules')
export class UserSchedulesController {
  constructor(private readonly userSchedulesService: UserSchedulesService) {}

  /** GET /api/user-schedules?userId=&editalId= */
  @Get()
  async getSchedule(
    @Query('userId') userId: string,
    @Query('editalId') editalId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId é obrigatório.');
    }
    if (editalId) {
      const schedule = await this.userSchedulesService.getUserSchedule(userId, editalId);
      return { data: schedule };
    }
    const schedules = await this.userSchedulesService.getUserSchedules(userId);
    return { data: schedules };
  }

  /** POST /api/user-schedules — cria ou atualiza cronograma do user para um edital */
  @Post()
  async upsertSchedule(
    @Body('userId') userId: string,
    @Body('editalId') editalId: string,
    @Body('horas_por_dia') horasPorDia: number,
    @Body('dias_por_semana') diasPorSemana: number,
    @Body('data_prova') dataProva?: string,
  ) {
    if (!userId || !editalId) {
      throw new BadRequestException('userId e editalId são obrigatórios.');
    }
    const result = await this.userSchedulesService.upsertUserSchedule(userId, editalId, {
      horas_por_dia: horasPorDia ? Number(horasPorDia) : undefined,
      dias_por_semana: diasPorSemana ? Number(diasPorSemana) : undefined,
      data_prova: dataProva || undefined,
    });
    return { message: 'Cronograma salvo com sucesso!', data: result };
  }

  /** DELETE /api/user-schedules/:editalId?userId= */
  @Delete(':editalId')
  async deleteSchedule(
    @Param('editalId') editalId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId || !editalId) {
      throw new BadRequestException('userId e editalId são obrigatórios.');
    }
    const ok = await this.userSchedulesService.deleteUserSchedule(userId, editalId);
    return { message: ok ? 'Cronograma removido.' : 'Cronograma não encontrado.', success: ok };
  }
}
