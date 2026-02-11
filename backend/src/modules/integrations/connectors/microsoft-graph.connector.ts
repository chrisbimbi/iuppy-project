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
        // Realistic Azure AD Schema
        return [
            { key: 'id', label: 'Object ID', type: 'string', sampleValue: '53569420-9426-4443-a619-...' },
            { key: 'userPrincipalName', label: 'User Principal Name (Email)', type: 'string', sampleValue: 'alex.wilber@contoso.com' },
            { key: 'displayName', label: 'Display Name', type: 'string', sampleValue: 'Alex Wilber' },
            { key: 'givenName', label: 'Given Name', type: 'string', sampleValue: 'Alex' },
            { key: 'surname', label: 'Surname', type: 'string', sampleValue: 'Wilber' },
            { key: 'jobTitle', label: 'Job Title', type: 'string', sampleValue: 'Marketing Assistant' },
            { key: 'department', label: 'Department', type: 'string', sampleValue: 'Marketing' },
            { key: 'officeLocation', label: 'Office Location', type: 'string', sampleValue: '131/1105' },
            { key: 'mobilePhone', label: 'Mobile Phone', type: 'string', sampleValue: '+1 858 555 0109' },
            { key: 'accountEnabled', label: 'Account Enabled', type: 'boolean', sampleValue: true },
            { key: 'city', label: 'City', type: 'string', sampleValue: 'San Diego' },
            { key: 'country', label: 'Country', type: 'string', sampleValue: 'United States' },
            { key: 'employeeId', label: 'Employee ID', type: 'string', sampleValue: '123456' },
            { key: 'onPremisesExtensionAttributes.extensionAttribute1', label: 'Cost Center (Ext1)', type: 'string', sampleValue: 'CC-9902' }
        ];
    }

    async syncUsers(cursor?: string, updatedSince?: Date): Promise<ConnectorSyncResult<NormalizedUser>> {
        if (this.isGlobalSimulator) {
            const limit = 50; // Batch size
            const offset = cursor ? parseInt(cursor) : 0;
            const totalMockUsers = 1000;

            if (offset >= totalMockUsers) {
                return { data: [], hasMore: false };
            }

            const rawUsers = this.generateMockUsers(limit, offset);

            // Map to NormalizedUser
            const normalized: NormalizedUser[] = rawUsers.map(u => ({
                externalId: u.externalId,
                email: u.email,
                fullName: u.name,
                firstName: u.raw.givenName || u.name.split(' ')[0],
                lastName: u.raw.surname || u.name.split(' ').slice(1).join(' '),
                isActive: u.active,
                jobTitle: u.jobTitle,
                department: u.department,
                location: u.raw.officeLocation,
                hireDate: u.raw.hireDate ? new Date(u.raw.hireDate) : undefined,
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

        const firstNames = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiana', 'Vitor', 'Yasmin'];
        const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira'];

        const users: any[] = [];

        for (let i = 0; i < count; i++) {
            const index = startIndex + i;
            const fn = firstNames[index % firstNames.length];
            const ln = lastNames[(index + 3) % lastNames.length] + ((index > 50) ? ` ${lastNames[(index + 7) % lastNames.length]}` : '');
            const dept = departments[index % departments.length];
            const availableRoles = roles[dept as keyof typeof roles];
            const role = availableRoles[index % availableRoles.length];
            const loc = locations[index % locations.length];
            const contract = contractTypes[index % contractTypes.length];
            const shift = shifts[index % shifts.length];

            const email = `${fn.toLowerCase()}.${ln.split(' ')[0].toLowerCase()}@empresa.com.br` // Fix split issue
                .replace(/\s/g, '');

            const id = `53569420-mock-${index.toString().padStart(6, '0')}`;

            // Random dates
            const hireYear = 2015 + (index % 10);
            const hireMonth = (index % 12) + 1;
            const hireDate = new Date(`${hireYear}-${hireMonth}-15`).toISOString();

            // Random termination (5% chance)
            const isTerminated = index % 20 === 0;
            const terminationDate = isTerminated ? new Date(`2025-01-10`).toISOString() : null;

            // Manager Logic (Simple: User 0 is boss of 1-10, etc)
            const managerEmail = index > 5 ? `carlos.oliveira@empresa.com.br` : null; // CEO

            // Payroll / Vacation Mock
            const payrollData = {
                bank: 'Banco do Brasil',
                agency: '1234-5',
                account: '99999-9',
                lastPayslipUrl: 'https://holerite.exemplo.com/doc/123.pdf',
                baseSalary: 3000 + (index * 50)
            };

            const vacationData = {
                balanceDays: 30 - (index % 15),
                nextPeriodStart: '2025-12-01',
                history: [
                    { period: '2023-2024', daysTaken: 30, status: 'Paid' }
                ]
            };

            users.push({
                externalId: id,
                email: email,
                name: `${fn} ${ln}`,
                jobTitle: email === 'julia.almeida@empresa.com.br' ? 'Diretora de Arte' : role,
                department: dept,
                active: !isTerminated,
                raw: {
                    id: id,
                    userPrincipalName: email,
                    displayName: `${fn} ${ln}`,
                    givenName: fn,
                    surname: ln,
                    jobTitle: role,
                    department: dept,
                    officeLocation: loc,
                    city: loc,
                    country: 'Brasil',
                    employeeId: (10000 + index).toString(),
                    accountEnabled: !isTerminated,

                    // Extended Mapped Fields
                    contractType: contract,
                    workShift: shift,
                    hireDate: hireDate,
                    terminationDate: terminationDate,
                    managerEmail: managerEmail,
                    payrollData: payrollData,
                    vacationData: vacationData,

                    // Flattened for AutoMapper if needed
                    mobilePhone: `+55 11 9${(10000000 + index).toString()}`
                }
            });
        }

        return users;
    }
}
