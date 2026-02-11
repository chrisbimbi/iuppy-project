import { Injectable } from '@nestjs/common';
import { SchemaField } from '../connectors/integration-connector.interface';

@Injectable()
export class AutoMapperService {

    // Our internal standard user schema
    private readonly internalSchema = [
        { key: 'name', labels: ['name', 'nome', 'fullname', 'displayname', 'givenname'] },
        { key: 'email', labels: ['email', 'mail', 'e-mail', 'userprincipalname'] },
        { key: 'role', labels: ['role', 'jobtitle', 'job', 'cargo', 'funcao', 'position'] },
        { key: 'department', labels: ['department', 'departamento', 'area', 'setor', 'unit', 'cost center', 'centro de custo'] },
        { key: 'jobTitle', labels: ['role', 'jobtitle', 'job', 'cargo', 'funcao', 'position'] },
        { key: 'phone', labels: ['phone', 'mobile', 'cell', 'telefone', 'celular'] },
        { key: 'hireDate', labels: ['hiredate', 'admissao', 'startdate', 'data_inicio', 'joined'] },
        { key: 'birthDate', labels: ['birthdate', 'nascimento', 'birthday', 'dob', 'data_nascimento'] },
        { key: 'registrationNumber', labels: ['employeeid', 'matricula', 're', 'chapa', 'workerid', 'id'] },
        { key: 'costCenter', labels: ['costcenter', 'centro_custo', 'cc'] },
        { key: 'terminationDate', labels: ['terminationdate', 'demissao', 'saida', 'enddate'] },
        { key: 'payrollData', labels: ['payroll', 'folha', 'pagamento', 'salario', 'salary', 'bank'] },
        { key: 'vacationData', labels: ['vacation', 'ferias', 'periodo_aquisitivo'] },
        { key: 'contractType', labels: ['contract', 'contrato', 'tipo_contrato', 'employee_type', 'employment', 'vinculo'] },
        { key: 'workShift', labels: ['shift', 'turno', 'horario', 'work_schedule', 'jornada'] },
        { key: 'managerEmail', labels: ['manager', 'gestor', 'manager_email', 'reports_to', 'lider', 'coordenador'] },
        { key: 'active', labels: ['active', 'enabled', 'ativo', 'accountenabled', 'status'] },
        { key: 'avatar', labels: ['photo', 'avatar', 'picture', 'image'] },
    ];

    /**
     * Smartly suggests a mapping between ERP fields and our Internal Schema
     */
    suggestMapping(erpSchema: SchemaField[]): Record<string, string> {
        const mapping: Record<string, string> = {}; // { internalKey: erpKey }

        for (const internalField of this.internalSchema) {
            // Find best match in ERP schema
            const match = erpSchema.find(erpField => {
                const k = erpField.key.toLowerCase();
                const l = erpField.label.toLowerCase();

                // Check exact matches or includes in our known labels list
                return internalField.labels.some(label => k === label || l === label || k.includes(label));
            });

            if (match) {
                // Store as: internalField.key <- erpField.key
                mapping[internalField.key] = match.key;
            }
        }

        return mapping;
    }
    /**
     * Applies the configuration mapping to a raw record to produce a Standard User object
     */
    mapRecord(rawRecord: any, mapping: Record<string, string>): any {
        const result: any = {};

        // Inverse the mapping: Internal Key <- External Key
        // The mapping stored is { "internalField": "externalField" }
        for (const [internalKey, externalKey] of Object.entries(mapping)) {
            // Support nested keys like "attributes.custom_field" if needed, 
            // but for now simple key access
            const value = rawRecord[externalKey];
            if (value !== undefined && value !== null) {
                result[internalKey] = value;
            }
        }
        return result;
    }

    /**
     * Returns the Internal Schema definition for the UI
     */
    getInternalSchema() {
        return this.internalSchema;
    }
}
