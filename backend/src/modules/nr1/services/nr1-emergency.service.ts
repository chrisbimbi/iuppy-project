import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1EmergencyProcedure } from '../entities/nr1-emergency-procedure.entity';
import { Nr1EmergencyDrill } from '../entities/nr1-emergency-drill.entity';
import { Nr1DrillAttendance } from '../entities/nr1-drill-attendance.entity';

@Injectable()
export class Nr1EmergencyService {
    constructor(
        @InjectRepository(Nr1EmergencyProcedure)
        private readonly proceduresRepo: Repository<Nr1EmergencyProcedure>,
        @InjectRepository(Nr1EmergencyDrill)
        private readonly drillsRepo: Repository<Nr1EmergencyDrill>,
        @InjectRepository(Nr1DrillAttendance)
        private readonly attendanceRepo: Repository<Nr1DrillAttendance>,
    ) { }

    // --- PROCEDURES ---

    async listProcedures(companyId: string) {
        return this.proceduresRepo.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
        });
    }

    async upsertProcedure(
        companyId: string,
        dto: Partial<Nr1EmergencyProcedure>,
    ) {
        const entity = this.proceduresRepo.create({
            ...dto,
            company_id: companyId,
        });
        return this.proceduresRepo.save(entity);
    }

    async deleteProcedure(companyId: string, id: string) {
        return this.proceduresRepo.delete({ id, company_id: companyId });
    }

    // --- DRILLS ---

    async listDrills(companyId: string) {
        return this.drillsRepo.find({
            where: { company_id: companyId },
            order: { data_agendada: 'DESC' },
            relations: ['attendances'],
        });
    }

    async getDrill(companyId: string, id: string) {
        return this.drillsRepo.findOne({
            where: { id, company_id: companyId },
            relations: ['attendances'],
        });
    }

    async upsertDrill(companyId: string, dto: Partial<Nr1EmergencyDrill>) {
        const entity = this.drillsRepo.create({
            ...dto,
            company_id: companyId,
        });
        return this.drillsRepo.save(entity);
    }

    async deleteDrill(companyId: string, id: string) {
        return this.drillsRepo.delete({ id, company_id: companyId });
    }

    // --- ATTENDANCE ---

    async registerAttendance(
        companyId: string,
        drillId: string,
        userId: string,
        evidence?: string,
    ) {
        const drill = await this.drillsRepo.findOneBy({ id: drillId, company_id: companyId });
        if (!drill) throw new NotFoundException('Drill not found');

        const existing = await this.attendanceRepo.findOneBy({ drill_id: drillId, user_id: userId });
        if (existing) return existing;

        const att = this.attendanceRepo.create({
            // company_id doesn't exist on attendance entity? Let me check.
            // The entity listing shows drill_id, user_id, checkin info. No company_id directly on attendance.
            drill_id: drillId,
            user_id: userId,
            hora_checkin: new Date(),
            evidencias: evidence ? { photoUrl: evidence } : null,
            metodo: 'app',
        });
        return this.attendanceRepo.save(att);
    }
}
