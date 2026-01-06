import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
    handleRequest(err, user, info) {
        // Se houver erro ou não houver usuário, retorna null (não lança exceção)
        // Isso permite que o endpoint continue como "anônimo" ou "não autenticado"
        if (err || !user) {
            return null;
        }
        return user;
    }
}
