import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './user.entity';
import { GroupEntity } from '../groups/group.entity';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { Role } from '@shared/types';
import * as argon2 from 'argon2';

@Injectable()
export class UserImportService {
  private readonly logger = new Logger(UserImportService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async importUsers(
    companyId: string,
    fileBuffer: Buffer,
    filename: string,
    syncKeyField: string = 'email', // 'email', 'cpf', 'matricula' (mapped to syncKey)
  ): Promise<{
    total: number;
    created: number;
    updated: number;
    errors: any[];
  }> {
    const workbook = new ExcelJS.Workbook();
    if (filename.endsWith('.csv')) {
      await workbook.csv.read(
        new Readable({
          read() {
            this.push(fileBuffer);
            this.push(null);
          },
        }),
      );
    } else {
      await workbook.xlsx.load(fileBuffer);
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new BadRequestException('Arquivo vazio ou inválido');

    // Headers mapping
    // Expected: Name, Email, Department, JobTitle, Location, HireDate, ...Groups
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.text?.trim();
    });

    const stats = { total: 0, created: 0, updated: 0, errors: [] as any[] };
    const groupsCache = new Map<string, GroupEntity>();

    // Pre-load company groups
    const existingGroups = await this.groupRepo.find({ where: { companyId } });
    existingGroups.forEach((g) => groupsCache.set(g.name.toLowerCase(), g));

    // Process rows
    // Using transaction for safety? Maybe too slow for large files. Let's do batch or row-by-row.
    // Row-by-row for now with error tracking.

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      if (row.cellCount === 0) continue;

      try {
        const rowData: any = {};
        headers.forEach((header, index) => {
          if (header && index > 0) {
            // exceljs is 1-based
            const val = row.getCell(index).value;
            rowData[header] = val?.toString()?.trim(); // simple string conversion
          }
        });

        if (!rowData['Email'] && !rowData['SyncKey']) {
          // Skip empty rows
          continue;
        }

        stats.total++;
        await this.processRow(
          companyId,
          rowData,
          syncKeyField,
          groupsCache,
          stats,
        );
      } catch (error) {
        this.logger.error(`Error processing row ${i}: ${error}`);
        stats.errors.push({ row: i, error: error.message });
      }
    }

    return stats;
  }

  private async processRow(
    companyId: string,
    data: any,
    syncKeyConfig: string,
    groupsCache: Map<string, GroupEntity>,
    stats: any,
  ) {
    // Map standard fields
    // Flexible mapping: keys can be "Email", "email", "E-mail" etc.
    const getVal = (keys: string[]) => {
      for (const k of keys) {
        const found = Object.keys(data).find(
          (dk) => dk.toLowerCase() === k.toLowerCase(),
        );
        if (found) return data[found];
      }
      return null;
    };

    const email = getVal(['Email', 'E-mail', 'Correo']);
    const name = getVal(['Name', 'Nome', 'Nombre']);
    const department = getVal(['Department', 'Departamento', 'Setor', 'Área']);
    const jobTitle = getVal(['JobTitle', 'Cargo', 'Função']);
    const location = getVal(['Location', 'Local', 'Cidade', 'Filial']);
    const hireDateRaw = getVal(['HireDate', 'DataAdmissao', 'Admissão']);
    const phone = getVal(['Phone', 'Telefone', 'Celular']);
    const syncKeyVal = getVal(['SyncKey', 'Matricula', 'CPF', 'ID']);

    // Determine unique key
    let uniqueKey = email;
    if (syncKeyConfig !== 'email') {
      uniqueKey = syncKeyVal;
    }

    if (!uniqueKey)
      throw new Error(
        `Chave única (${syncKeyConfig}) não encontrada na linha.`,
      );

    // Find existing user
    let user = await this.userRepo.findOne({
      where: [
        { companyId, email: uniqueKey }, // if syncKey is email
        { companyId, syncKey: uniqueKey },
      ],
    });

    const isNew = !user;
    if (isNew) {
      user = new UserEntity();
      user.companyId = companyId;
      user.password = await argon2.hash('mudar123'); // Default password
      user.role = Role.User;
      user.isActive = true;
      stats.created++;
    } else {
      stats.updated++;
    }

    // Update fields
    if (email) user.email = email;
    if (name) user.name = name;
    if (department) user.department = department;
    if (jobTitle) user.jobTitle = jobTitle;
    if (location) user.location = location;
    if (phone) user.phone = phone;
    if (syncKeyConfig !== 'email' && syncKeyVal) user.syncKey = syncKeyVal;

    if (hireDateRaw) {
      const d = new Date(hireDateRaw);
      if (!isNaN(d.getTime())) user.hireDate = d;
    }

    // Custom attributes & Groups
    // Any column not mapped above could be a group or custom attribute.
    // Strategy: If column header starts with "Group:", treat as group.
    // Or simpler: "Time", "Squad" -> create group "Time:Flamengo"

    // For MVP V-0: Let's look for specific columns or just "Groups" column (comma separated)
    const groupsRaw = getVal(['Groups', 'Grupos']);
    const groupsToAdd: GroupEntity[] = [];

    if (groupsRaw) {
      const groupNames = groupsRaw
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      for (const gName of groupNames) {
        let group = groupsCache.get(gName.toLowerCase());
        if (!group) {
          // Create new group
          group = this.groupRepo.create({
            companyId,
            name: gName,
            description: 'Importado via planilha',
            isAutoCreated: true,
          });
          group = await this.groupRepo.save(group);
          groupsCache.set(gName.toLowerCase(), group);
        }
        groupsToAdd.push(group);
      }
    }

    // Dynamic Groups from Dept/Location
    if (department) {
      const gName = `Dept: ${department}`;
      let group = groupsCache.get(gName.toLowerCase());
      if (!group) {
        group = await this.groupRepo.save(
          this.groupRepo.create({
            companyId,
            name: gName,
            isAutoCreated: true,
          }),
        );
        groupsCache.set(gName.toLowerCase(), group);
      }
      groupsToAdd.push(group);
    }

    if (location) {
      const gName = `Local: ${location}`;
      let group = groupsCache.get(gName.toLowerCase());
      if (!group) {
        group = await this.groupRepo.save(
          this.groupRepo.create({
            companyId,
            name: gName,
            isAutoCreated: true,
          }),
        );
        groupsCache.set(gName.toLowerCase(), group);
      }
      groupsToAdd.push(group);
    }

    // Save user first
    const savedUser = await this.userRepo.save(user);

    // Update relations
    if (groupsToAdd.length > 0) {
      // We need to update user_group_members table.
      // TypeORM ManyToMany save can be tricky if we don't load existing relations.
      // Let's do direct SQL or load relations. Direct SQL is safer/faster for bulk.

      // Clear existing auto-groups? No, maybe just add.
      // For MVP, let's just add.

      for (const g of groupsToAdd) {
        await this.dataSource.query(
          `INSERT INTO user_group_members (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [savedUser.id, g.id],
        );
      }
    }
  }
}
