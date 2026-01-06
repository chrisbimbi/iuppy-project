import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddVacationPolicyFields1701234567890 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = [
            { name: "minDaysPerPeriod", type: "jsonb", default: "'{}'" },
            { name: "allowCashAllowance", type: "boolean", default: true },
            { name: "sellingLimitDays", type: "int", default: 10 },
            { name: "sellingTiming", type: "varchar", default: "'START_OF_PERIOD'" },
            { name: "allow13thAdvance", type: "boolean", default: true },
            { name: "approvalFlow", type: "varchar", default: "'MANAGER'" },
            { name: "approvalSlaDays", type: "int", default: 5 },
            { name: "accrualLogic", type: "varchar", default: "'standard'" }
        ];

        for (const col of columns) {
            const hasColumn = await queryRunner.hasColumn("vacation_policies", col.name);
            if (!hasColumn) {
                await queryRunner.addColumn("vacation_policies", new TableColumn({
                    name: col.name,
                    type: col.type as any,
                    default: col.default as any
                }));
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("vacation_policies", [
            "minDaysPerPeriod",
            "allowCashAllowance",
            "sellingLimitDays",
            "sellingTiming",
            "allow13thAdvance",
            "approvalFlow",
            "approvalSlaDays",
            "accrualLogic"
        ]);
    }

}
