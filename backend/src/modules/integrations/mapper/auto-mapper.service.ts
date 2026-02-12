import { Injectable } from '@nestjs/common';
import { SchemaField } from '../connectors/integration-connector.interface';

@Injectable()
export class AutoMapperService {

    // Our internal standard user schema
    private readonly internalSchema = [
        // --- Nome e Pessoal ---
        { key: 'name', labels: ['name', 'nome', 'fullname', 'displayname', 'givenname', 'ra_nome', 'ra_nomecmp'] },
        { key: 'firstName', labels: ['firstname', 'primeiro_nome', 'ra_nome'] },
        { key: 'lastName', labels: ['lastname', 'sobrenome'] },
        { key: 'middleName', labels: ['middlename', 'nome_meio'] },
        { key: 'preferredName', labels: ['preferredname', 'nome_social', 'nome_fantasia', 'apelido'] },
        { key: 'birthDate', labels: ['birthdate', 'nascimento', 'birthday', 'dob', 'data_nascimento', 'ra_nascimento', 'data_nasc'] },
        { key: 'gender', labels: ['gender', 'genero', 'sexo', 'ra_sexo'] },
        { key: 'maritalStatus', labels: ['maritalstatus', 'estado_civil', 'ra_estcivi'] },
        { key: 'nationality', labels: ['nationality', 'nacionalidade', 'ra_cpaisor', 'pais_origem'] },
        { key: 'academicLevel', labels: ['academiclevel', 'escolaridade', 'formao', 'education', 'ra_escolar'] },
        { key: 'raceColor', labels: ['race', 'color', 'raca', 'cor', 'etnia', 'ra_raca'] },
        { key: 'disabilityType', labels: ['disability', 'deficiencia', 'pcd', 'ra_pcd'] },

        // --- Documentos ---
        { key: 'email', labels: ['email', 'mail', 'e-mail', 'userprincipalname'] },
        { key: 'secondaryEmail', labels: ['secondaryemail', 'email_secundario'] },
        { key: 'personalEmail', labels: ['personalemail', 'email_pessoal'] },
        { key: 'cpf', labels: ['cpf', 'taxid', 'documento', 'ra_cpf'] },
        { key: 'rg', labels: ['rg', 'identidade', 'ra_rg'] },
        { key: 'rgIssuer', labels: ['rgissuer', 'orgao_emissor', 'ra_rgorg'] },
        { key: 'rgState', labels: ['rgstate', 'uf_rg', 'ra_rguf'] },
        { key: 'rgIssueDate', labels: ['rgissuedate', 'data_rg'] },
        { key: 'pis', labels: ['pis', 'pasep', 'nis', 'ra_pis'] },
        { key: 'ctpsNumber', labels: ['ctps', 'ra_numctps'] },
        { key: 'ctpsSeries', labels: ['ctps_series', 'ra_serctps'] },
        { key: 'ctpsState', labels: ['ctps_state', 'ra_ufctps'] },
        { key: 'voterId', labels: ['voterid', 'titulo_eleitor', 'ra_tit_ele'] },

        // --- Contato e Endereço ---
        { key: 'phone', labels: ['phone', 'telephone', 'telefone', 'comercial', 'ra_telef'] },
        { key: 'mobile', labels: ['mobile', 'cell', 'celular', 'phone_number'] },
        { key: 'emergencyContactName', labels: ['emergency_contact', 'contato_emergencia'] },
        { key: 'emergencyContactPhone', labels: ['emergency_phone'] },
        { key: 'address', labels: ['address', 'endereco', 'residencia', 'logradouro', 'ra_end'] },
        { key: 'addressStreet', labels: ['street', 'rua', 'ra_end'] },
        { key: 'addressNumber', labels: ['number', 'numero', 'ra_numend'] },
        { key: 'addressComplement', labels: ['complement', 'complemento', 'ra_complemento'] },
        { key: 'addressNeighborhood', labels: ['neighborhood', 'bairro', 'ra_bairro'] },
        { key: 'addressCity', labels: ['city', 'cidade', 'municipio', 'ra_munic'] },
        { key: 'addressState', labels: ['state', 'estado', 'uf', 'ra_estado'] },
        { key: 'addressZipCode', labels: ['zipcode', 'cep', 'postalcode', 'ra_cep'] },

        // --- Emprego e Hierarquia ---
        { key: 'registrationNumber', labels: ['employeeid', 'matricula', 're', 'chapa', 'workerid', 'ra_mat', 'registration_number'] },
        { key: 'role', labels: ['role', 'jobtitle', 'job', 'cargo', 'funcao', 'position', 'ra_cargo'] },
        { key: 'jobTitle', labels: ['role', 'jobtitle', 'job', 'cargo', 'funcao', 'position'] },
        { key: 'department', labels: ['department', 'departamento', 'area', 'setor', 'unit', 'ra_depto'] },
        { key: 'costCenter', labels: ['costcenter', 'centro_custo', 'cc', 'ra_cc'] },
        { key: 'legalEntity', labels: ['legalentity', 'empresa', 'filial', 'cnpj', 'ra_filial'] },
        { key: 'employmentType', labels: ['contract', 'contrato', 'tipo_contrato', 'employee_type', 'employment', 'vinculo', 'ra_tipcont'] },
        { key: 'employmentStatus', labels: ['status', 'situacao', 'employment_status', 'ra_situa'] },
        { key: 'workShift', labels: ['shift', 'turno', 'horario', 'work_schedule', 'jornada', 'ra_tnotrab'] },
        { key: 'managerEmail', labels: ['manager', 'gestor', 'reports_to', 'lider', 'coordenador', 'manageremail'] },
        { key: 'managerId', labels: ['manager_id', 'gestor_id'] },
        { key: 'location', labels: ['location', 'unidade', 'site', 'ra_local'] },
        { key: 'hireDate', labels: ['hiredate', 'admissao', 'startdate', 'data_inicio', 'joined', 'ra_admiss'] },
        { key: 'terminationDate', labels: ['terminationdate', 'demissao', 'saida', 'enddate', 'ra_demiss'] },
        { key: 'probationEndDate', labels: ['probation', 'experiencia', 'ra_vctoexp'] },
        { key: 'active', labels: ['active', 'enabled', 'ativo', 'accountenabled', 'status', 'ra_situa'] },

        // --- Remuneração e Financeiro ---
        { key: 'baseSalary', labels: ['salary', 'salario', 'remuneracao', 'base_salary', 'ra_salario'] },
        { key: 'hourlyRate', labels: ['hourlyrate', 'valor_hora', 'ra_valorhr'] },
        { key: 'payFrequency', labels: ['payfrequency', 'periodicidade', 'frequencia'] },
        { key: 'currency', labels: ['currency', 'moeda'] },
        { key: 'bankName', labels: ['bank', 'banco', 'ra_banco'] },
        { key: 'bankBranch', labels: ['branch', 'agencia', 'ra_agencia'] },
        { key: 'bankAccount', labels: ['account', 'conta', 'ra_numcc'] },
        { key: 'bankAccountType', labels: ['account_type', 'tipo_conta'] },
        { key: 'pixKey', labels: ['pix', 'chave_pix'] },

        // --- Outros ---
        { key: 'avatar', labels: ['photo', 'avatar', 'picture', 'image', 'ra_bitmap'] },
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

        // The mapping stored is { "internalField": "externalPath" }
        for (const [internalKey, externalPath] of Object.entries(mapping)) {
            const value = this.getDeepFieldValue(rawRecord, externalPath);
            if (value !== undefined && value !== null) {
                result[internalKey] = value;
            }
        }
        return result;
    }

    private getDeepFieldValue(obj: any, path: string): any {
        if (!path) return undefined;
        // Try exact match first (many flat ERP records use dots in keys)
        if (obj && obj[path] !== undefined) return obj[path];

        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * Returns the Internal Schema definition for the UI
     */
    getInternalSchema() {
        return this.internalSchema;
    }
}
