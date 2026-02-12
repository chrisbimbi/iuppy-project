import { BaseConnector, ConnectorSyncResult, NormalizedUser } from './base.connector';
import { SchemaField } from './integration-connector.interface';

// Not @Injectable() because it is instantiated by Factory manually
export class MicrosoftGraphConnector extends BaseConnector {
    private isGlobalSimulator = true; // For dev/demo purposes

    async testConnection(): Promise<boolean> {
        // In real impl: Validate ClientID/Secret against https://login.microsoftonline.com
        // For demo: Always return true if simulate mode
        if (this.isGlobalSimulator) return true;
        return !!this.secrets.clientId;
    }

    async fetchSchema(): Promise<SchemaField[]> {
        // Gold Standard Schema spanning Microsoft, TOTVS, SAP, ADP, and LG
        return [
            // --- Identificadores ---
            { key: 'id', label: 'Object ID', type: 'string', sampleValue: '53569420-9426-4443-a619-...' },
            { key: 'userPrincipalName', label: 'User Principal Name (Email)', type: 'string', sampleValue: 'alex.wilber@contoso.com' },
            { key: 'employeeId', label: 'Employee ID / Matrícula', type: 'string', sampleValue: '123456' },

            // --- Nome e Pessoal ---
            { key: 'displayName', label: 'Display Name', type: 'string', sampleValue: 'Alex Wilber' },
            { key: 'givenName', label: 'Given Name', type: 'string', sampleValue: 'Alex' },
            { key: 'surname', label: 'Surname', type: 'string', sampleValue: 'Wilber' },
            { key: 'middleName', label: 'Middle Name', type: 'string', sampleValue: 'Pimenta' },
            { key: 'preferredName', label: 'Preferred Name (Social)', type: 'string', sampleValue: 'Alemão' },
            { key: 'birthDate', label: 'Birth Date', type: 'string', sampleValue: '1990-05-15' },
            { key: 'gender', label: 'Gender', type: 'string', sampleValue: 'Masculino' },
            { key: 'maritalStatus', label: 'Marital Status', type: 'string', sampleValue: 'Casado(a)' },
            { key: 'nationality', label: 'Nationality', type: 'string', sampleValue: 'Brasileira' },
            { key: 'academicLevel', label: 'Academic Level / Escolaridade', type: 'string', sampleValue: 'Pós-Graduação' },
            { key: 'raceColor', label: 'Race / Color (eSocial)', type: 'string', sampleValue: 'Branca' },
            { key: 'disabilityType', label: 'Disability / PCD', type: 'string', sampleValue: 'Nenhuma' },

            // --- Documentos ---
            { key: 'cpf', label: 'CPF', type: 'string', sampleValue: '123.456.789-00' },
            { key: 'rg', label: 'RG', type: 'string', sampleValue: '12.345.678-9' },
            { key: 'rgIssuer', label: 'RG Issuer', type: 'string', sampleValue: 'SSP' },
            { key: 'rgState', label: 'RG State (UF)', type: 'string', sampleValue: 'SP' },
            { key: 'rgIssueDate', label: 'RG Issue Date', type: 'string', sampleValue: '2010-01-01' },
            { key: 'pis', label: 'PIS/PASEP/NIS', type: 'string', sampleValue: '123.45678.90-1' },
            { key: 'ctpsNumber', label: 'CTPS Number', type: 'string', sampleValue: '1234567' },
            { key: 'ctpsSeries', label: 'CTPS Series', type: 'string', sampleValue: '001-0' },
            { key: 'ctpsState', label: 'CTPS State (UF)', type: 'string', sampleValue: 'SP' },
            { key: 'voterId', label: 'Voter ID (Título)', type: 'string', sampleValue: '123456789012' },

            // --- Contato e Endereço ---
            { key: 'mobilePhone', label: 'Mobile Phone', type: 'string', sampleValue: '+55 11 99999-9999' },
            { key: 'businessPhones', label: 'Business Phones', type: 'string', sampleValue: '["+55 11 1111-1111"]' },
            { key: 'personalEmail', label: 'Personal Email', type: 'string', sampleValue: 'alex@personal.com' },
            { key: 'emergencyContact.name', label: 'Emergency Contact Name', type: 'string', sampleValue: 'Maria Wilber' },
            { key: 'emergencyContact.phone', label: 'Emergency Contact Phone', type: 'string', sampleValue: '+55 11 88888-8888' },
            { key: 'streetAddress', label: 'Street Address', type: 'string', sampleValue: 'Avenida Paulista, 1000' },
            { key: 'streetAddressNumber', label: 'Address Number', type: 'string', sampleValue: '1000' },
            { key: 'city', label: 'City', type: 'string', sampleValue: 'São Paulo' },
            { key: 'state', label: 'State (UF)', type: 'string', sampleValue: 'SP' },
            { key: 'postalCode', label: 'Zip Code (CEP)', type: 'string', sampleValue: '01310-100' },
            { key: 'country', label: 'Country', type: 'string', sampleValue: 'Brasil' },

            // --- Emprego e Hierarquia ---
            { key: 'jobTitle', label: 'Job Title / Cargo', type: 'string', sampleValue: 'Analista Sênior' },
            { key: 'department', label: 'Department / Setor', type: 'string', sampleValue: 'Marketing' },
            { key: 'onPremisesExtensionAttributes.extensionAttribute1', label: 'Cost Center / CC', type: 'string', sampleValue: 'CC-Marketing-SP' },
            { key: 'companyName', label: 'Company / Filial (Legal Entity)', type: 'string', sampleValue: 'Iuppy Brasil LTDA' },
            { key: 'contractType', label: 'Contract Type (CLT/PJ)', type: 'string', sampleValue: 'CLT' },
            { key: 'workShift', label: 'Work Shift (Turno)', type: 'string', sampleValue: '09:00 - 18:00' },
            { key: 'managerEmail', label: 'Manager Email', type: 'string', sampleValue: 'boss@contoso.com' },
            { key: 'officeLocation', label: 'Office Location / Unidade', type: 'string', sampleValue: 'Sede SP' },
            { key: 'hireDate', label: 'Hire Date (Admissão)', type: 'string', sampleValue: '2023-01-01' },
            { key: 'terminationDate', label: 'Termination Date (Demissão)', type: 'string', sampleValue: null },
            { key: 'probationEndDate', label: 'Probation End Date (Exp)', type: 'string', sampleValue: '2023-04-01' },
            { key: 'accountEnabled', label: 'Account Enabled (Status)', type: 'boolean', sampleValue: true },

            // --- Remuneração e Financeiro ---
            { key: 'baseSalary', label: 'Base Salary', type: 'number', sampleValue: 5000.00 },
            { key: 'hourlyRate', label: 'Hourly Rate', type: 'number', sampleValue: null },
            { key: 'payFrequency', label: 'Pay Frequency', type: 'string', sampleValue: 'Monthly' },
            { key: 'payCurrency', label: 'Currency', type: 'string', sampleValue: 'BRL' },
            { key: 'bank.name', label: 'Bank Name', type: 'string', sampleValue: 'Itaú' },
            { key: 'bank.agency', label: 'Bank Agency', type: 'string', sampleValue: '0001' },
            { key: 'bank.account', label: 'Bank Account', type: 'string', sampleValue: '12345-6' },
            { key: 'bank.pix', label: 'PIX Key', type: 'string', sampleValue: 'alex@personal.com' }
        ];
    }

    async syncUsers(cursor?: string, updatedSince?: Date): Promise<ConnectorSyncResult<NormalizedUser>> {
        if (this.isGlobalSimulator) {
            const limit = 50;
            const offset = cursor ? parseInt(cursor) : 0;
            const totalMockUsers = 1000;

            if (offset >= totalMockUsers) {
                return { data: [], hasMore: false };
            }

            const rawUsers = this.generateMockUsers(limit, offset);

            const normalized: NormalizedUser[] = rawUsers.map(u => ({
                externalId: u.externalId,
                email: u.email,
                secondaryEmail: u.raw.secondaryEmail,
                personalEmail: u.raw.personalEmail,
                registrationNumber: u.raw.employeeId,

                fullName: u.name,
                firstName: u.raw.givenName,
                lastName: u.raw.surname,
                middleName: u.raw.middleName,
                preferredName: u.raw.preferredName,
                birthDate: u.raw.birthDate ? new Date(u.raw.birthDate) : undefined,
                gender: u.raw.gender,
                maritalStatus: u.raw.maritalStatus,
                nationality: u.raw.nationality,
                academicLevel: u.raw.academicLevel,
                raceColor: u.raw.raceColor,
                disabilityType: u.raw.disabilityType,

                cpf: u.raw.cpf,
                rg: u.raw.rg,
                rgIssuer: u.raw.rgIssuer,
                rgState: u.raw.rgState,
                rgIssueDate: u.raw.rgIssueDate ? new Date(u.raw.rgIssueDate) : undefined,
                pis: u.raw.pis,
                ctpsNumber: u.raw.ctpsNumber,
                ctpsSeries: u.raw.ctpsSeries,
                ctpsState: u.raw.ctpsState,
                voterId: u.raw.voterId,

                phone: u.raw.businessPhones?.[0],
                mobile: u.raw.mobilePhone,
                emergencyContactName: u.raw['emergencyContact.name'],
                emergencyContactPhone: u.raw['emergencyContact.phone'],
                address: u.raw.streetAddress,
                addressStreet: u.raw.streetAddress,
                addressNumber: u.raw.streetAddressNumber,
                addressCity: u.raw.city,
                addressState: u.raw.state,
                addressZipCode: u.raw.postalCode,

                role: u.raw.jobTitle,
                jobTitle: u.raw.jobTitle,
                department: u.raw.department,
                costCenter: u.raw['onPremisesExtensionAttributes.extensionAttribute1'],
                managerEmail: u.raw.managerEmail,
                location: u.raw.officeLocation,
                legalEntity: u.raw.companyName,
                employmentType: u.raw.contractType,
                employmentStatus: u.raw.accountEnabled ? 'Ativo' : 'Desligado',
                workShift: u.raw.workShift,
                hireDate: u.raw.hireDate ? new Date(u.raw.hireDate) : undefined,
                terminationDate: u.raw.terminationDate ? new Date(u.raw.terminationDate) : undefined,
                probationEndDate: u.raw.probationEndDate ? new Date(u.raw.probationEndDate) : undefined,
                isActive: u.active,

                baseSalary: u.raw.baseSalary,
                hourlyRate: u.raw.hourlyRate,
                payFrequency: u.raw.payFrequency,
                currency: u.raw.payCurrency,
                bankName: u.raw['bank.name'],
                bankBranch: u.raw['bank.agency'],
                bankAccount: u.raw['bank.account'],
                pixKey: u.raw['bank.pix'],

                rawPayload: u.raw
            }));

            const nextOffset = offset + rawUsers.length;

            return {
                data: normalized,
                hasMore: nextOffset < totalMockUsers,
                nextCursor: nextOffset.toString()
            };
        }
        return { data: [], hasMore: false };
    }

    // --- MOCK GENERATOR FOR "REALISTIC" 1000 USERS DEMO ---
    private generateMockUsers(count: number, startIndex: number): any[] {
        const departments = ['Vendas', 'Marketing', 'TI', 'Financeiro', 'Recursos Humanos', 'Operações', 'Logística', 'Diretoria'];
        const locations = ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Porto Alegre', 'Recife', 'Home Office'];
        const contractTypes = ['CLT', 'CLT', 'CLT', 'PJ', 'Estágio'];
        const shifts = ['09:00 - 18:00', '08:00 - 17:00', '12x36', 'Flexível'];
        const academicLevels = ['Superior Completo', 'Pós-Graduação', 'Mestrado', 'Doutorado', 'Ensino Médio'];
        const genders = ['Masculino', 'Feminino', 'Não Binário', 'Prefiro não informar'];
        const maritalStatuses = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];
        const banks = ['Itaú', 'Bradesco', 'Santander', 'Nubank', 'Banco do Brasil', 'Inter'];

        const roles = {
            'Vendas': ['Executivo de Contas', 'Gerente de Vendas', 'SDR', 'Coordenador Comercial'],
            'Marketing': ['Analista de Marketing', 'Designer', 'Copywriter', 'Gerente de Marketing'],
            'TI': ['Desenvolvedor Fullstack', 'DevOps Engineer', 'QA Analyst', 'Tech Lead', 'Diretor de TI'],
            'Financeiro': ['Analista Financeiro', 'Contador', 'Gerente Financeiro'],
            'Recursos Humanos': ['Analista de RH', 'Business Partner', 'Recrutador', 'Gerente de Gente e Gestão'],
            'Operações': ['Analista de Operações', 'Coordenador de Operações'],
            'Logística': ['Assistente de Logística', 'Coordenador de Logística'],
            'Diretoria': ['CEO', 'CFO', 'CTO', 'COO']
        };

        const firstNames = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiana', 'Vitor', 'Yasmin', 'Adriano', 'Beatriz', 'Caio', 'Debora', 'Elisa', 'Fabio', 'Giovanna', 'Hugo', 'Isabela', 'Joao'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Machado', 'Teixeira', 'Mendes', 'Nunes', 'Cardoso', 'Correia', 'Marques', 'Borges', 'Freitas', 'Castro'];
        const middleNames = ['Pimenta', 'Farias', 'Mendes', 'Nunes', 'Teixeira', 'Cardoso', 'Correia', 'Borges', 'Marques', 'Machado', 'Monteiro', 'Cavalcanti', 'Moraes', 'Aragao', 'Sampaio'];

        const users: any[] = [];

        for (let i = 0; i < count; i++) {
            const index = startIndex + i;
            const fn = firstNames[index % firstNames.length];
            const mn = middleNames[index % middleNames.length];
            const ln = lastNames[(index + 3) % lastNames.length];

            const dept = departments[index % departments.length];
            const availableRoles = roles[dept as keyof typeof roles];
            const role = availableRoles[index % availableRoles.length];
            const loc = locations[index % locations.length];
            const contract = contractTypes[index % contractTypes.length];
            const shift = shifts[index % shifts.length];

            const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${index}@empresa.com.br`.replace(/\s/g, '');
            const id = `53569420-mock-${index.toString().padStart(6, '0')}`;

            // Random dates
            const hireYear = 2015 + (index % 10);
            const hireMonth = (index % 12) + 1;
            const hireDate = new Date(`${hireYear}-${hireMonth}-15`).toISOString();

            const birthYear = 1970 + (index % 30);
            const birthDate = new Date(`${birthYear}-01-01`).toISOString();

            // Random termination (5% chance)
            const isTerminated = index % 20 === 0;
            const terminationDate = isTerminated ? new Date(`2025-01-10`).toISOString() : null;

            users.push({
                externalId: id,
                email: email,
                name: `${fn} ${mn} ${ln}`,
                jobTitle: role,
                department: dept,
                active: !isTerminated,
                raw: {
                    id: id,
                    userPrincipalName: email,
                    secondaryEmail: `sec.${email}`,
                    personalEmail: `${fn.toLowerCase()}${index}@gmail.com`,
                    displayName: `${fn} ${mn} ${ln}`,
                    givenName: fn,
                    middleName: mn,
                    surname: ln,
                    preferredName: fn,
                    jobTitle: role,
                    department: dept,
                    officeLocation: loc,
                    city: loc,
                    state: 'SP',
                    country: 'Brasil',
                    streetAddress: `Rua das Flores, ${100 + index}`,
                    streetAddressNumber: (100 + index).toString(),
                    postalCode: `01310-0${index % 100}`,
                    companyName: 'Iuppy Brasil LTDA',
                    employeeId: (10000 + index).toString(),
                    accountEnabled: !isTerminated,

                    // Brazilian Specifics (TOTVS/LG/eSocial style)
                    contractType: contract,
                    workShift: shift,
                    academicLevel: academicLevels[index % academicLevels.length],
                    gender: genders[index % genders.length],
                    maritalStatus: maritalStatuses[index % maritalStatuses.length],
                    nationality: 'Brasileira',
                    raceColor: index % 3 === 0 ? 'Parda' : 'Branca',
                    disabilityType: 'Nenhuma',

                    cpf: `${index.toString().padStart(3, '0')}.456.789-00`,
                    rg: `${10 + (index % 80)}.${index.toString().padStart(3, '0')}.123-X`,
                    rgIssuer: 'SSP',
                    rgState: 'SP',
                    rgIssueDate: '2015-05-10',
                    pis: `123.${index.toString().padStart(5, '0')}.90-1`,
                    ctpsNumber: (1000000 + index).toString(),
                    ctpsSeries: '001-0',
                    ctpsState: 'SP',
                    voterId: `1234567890${index % 100}`,

                    // Compensation & Financial
                    baseSalary: 3500 + (index * 75),
                    payFrequency: 'Monthly',
                    payCurrency: 'BRL',
                    'bank.name': banks[index % banks.length],
                    'bank.agency': '0001',
                    'bank.account': `${10000 + index}-X`,
                    'bank.pix': email,

                    hireDate: hireDate,
                    birthDate: birthDate,
                    terminationDate: terminationDate,
                    probationEndDate: (() => {
                        const d = new Date(hireDate);
                        d.setMonth(d.getMonth() + 3);
                        return d.toISOString();
                    })(),
                    managerEmail: index > 5 ? `carlos.oliveira@empresa.com.br` : null,

                    mobilePhone: `+55 11 9${(10000000 + index).toString()}`,
                    'emergencyContact.name': `Contato de ${fn}`,
                    'emergencyContact.phone': `+55 11 8888-888${index % 10}`
                }
            });
        }

        return users;
    }
}
