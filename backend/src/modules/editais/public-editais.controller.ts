import { Controller, Get, Query } from '@nestjs/common';
import { EditaisService } from './editais.service';

@Controller('api/public/editais')
export class PublicEditaisController {
  constructor(private readonly editaisService: EditaisService) {}

  @Get()
  async listPublicEditais() {
    return this.editaisService.getPublicEditais();
  }

  /** GET /api/public/editais/recent?limit=4&userId=<uuid>
   * Retorna os N últimos editais completed que o user ainda não adicionou.
   */
  @Get('recent')
  async getRecentEditais(
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const n = limit ? Math.min(parseInt(limit, 10), 20) : 4;
    return this.editaisService.getRecentCompletedEditais(n, userId);
  }
}
