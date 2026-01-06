
import { Injectable, Logger } from '@nestjs/common';

export interface CertificateData {
    employeeName: string;
    courseName: string;
    completionDate: Date;
    expirationDate?: Date;
    hours: number;
    providerName: string;
    confidence: number;
}

@Injectable()
export class CertificateOcrService {
    private readonly logger = new Logger(CertificateOcrService.name);

    /**
     * Simulates OCR extraction from a certificate PDF/Image.
     * In production, this would call Google Cloud Vision API or AWS Textract.
     */
    async extractData(file: Express.Multer.File): Promise<CertificateData> {
        this.logger.log(`Analyzing file: ${file.originalname} (${file.mimetype})`);

        // MOCK AI DELAY
        await new Promise(resolve => setTimeout(resolve, 1500));

        // MOCK LOGIC: Extract "metadata" from filename for testing
        // filename format expectation for mock: "CERT_NR35_JoaoSilva_2024.pdf"

        const isNR35 = file.originalname.toUpperCase().includes('NR35') || file.originalname.toUpperCase().includes('NR-35');
        const isNR10 = file.originalname.toUpperCase().includes('NR10') || file.originalname.toUpperCase().includes('NR-10');

        let courseName = 'Unknown Course';
        if (isNR35) courseName = 'NR-35 Trabalho em Altura';
        if (isNR10) courseName = 'NR-10 Instalações Elétricas';

        // Mock generic response
        return {
            employeeName: 'Detected Name (Mock)',
            courseName: courseName,
            completionDate: new Date(),
            expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // +2 years default
            hours: 8,
            providerName: 'Training Center Mock',
            confidence: 0.95 // High confidence simulation
        };
    }
}
