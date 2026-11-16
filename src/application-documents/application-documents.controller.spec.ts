import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationDocumentsController } from './application-documents.controller.js';

describe('ApplicationDocumentsController', () => {
  let controller: ApplicationDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationDocumentsController],
    }).compile();

    controller = module.get<ApplicationDocumentsController>(ApplicationDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
