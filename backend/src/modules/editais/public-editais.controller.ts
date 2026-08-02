import { Controller, Get } from '@nestjs/common';
import { EditaisService } from './editais.service';

@Controller('api/public/editais')
export class PublicEditaisController {
  constructor(private readonly editaisService: EditaisService) {}

  @Get()
  async listPublicEditais() {
    return this.editaisService.getPublicEditais();
  }
}
