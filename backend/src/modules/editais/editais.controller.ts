import { Controller, Get, Post, Param, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditaisService } from './editais.service';

@Controller('api/editais')
export class EditaisController {
  constructor(private readonly editaisService: EditaisService) {}

  @Get()
  async listEditais() {
    return this.editaisService.getAllEditais();
  }

  @Get(':id')
  async getEditalDetails(@Param('id') id: string) {
    return this.editaisService.getEditalPareto(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEdital(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('userId') userId: string,
  ) {
    const editalTitle = title || (file ? file.originalname.replace('.pdf', '') : 'Novo Edital');
    const uId = userId || 'usr-2';

    const edital = await this.editaisService.uploadAndAnalyzeEdital(file, editalTitle, uId);
    return {
      message: 'Edital enviado e analisado com a Regra Pareto 80/20!',
      data: edital,
    };
  }

  @Post(':id/toggle-topic')
  async toggleTopic(
    @Param('id') editalId: string,
    @Body('topicId') topicId: string,
    @Body('userId') userId: string,
  ) {
    if (!topicId) {
      throw new BadRequestException('ID do tópico é obrigatório.');
    }
    const uId = userId || 'usr-2';
    const updated = await this.editaisService.toggleTopicStatus(editalId, topicId, uId);
    return {
      message: 'Status do tópico atualizado!',
      data: updated,
    };
  }
}
