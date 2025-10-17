import { Module } from '@nestjs/common';
import { ChannelsV2Service } from './channels.service';
import { ChannelsV2Controller } from './channels.controller';

@Module({
    imports: [],
    controllers: [ChannelsV2Controller],
    providers: [ChannelsV2Service],
    exports: [ChannelsV2Service], // se outro módulo precisar, já está exportado
})
export class ChannelsV2Module { }