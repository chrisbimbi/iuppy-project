import { Injectable } from '@nestjs/common';
import * as https from 'https';
import * as tls from 'tls';

@Injectable()
export class MtlsAgentFactory {
    /**
     * Creates an HTTPS Agent with client certificate.
     * Useful for ADP and LG Gen.te integrations.
     */
    createAgent(cert: string | Buffer, key: string | Buffer, passphrase?: string): https.Agent {
        return new https.Agent({
            cert,
            key,
            passphrase,
            minVersion: 'TLSv1.2',
            keepAlive: true,
        });
    }

    /**
     * Creates a secure context if needed specifically for some axios configs
     */
    createSecureContext(cert: string | Buffer, key: string | Buffer, passphrase?: string): tls.SecureContext {
        return tls.createSecureContext({
            cert,
            key,
            passphrase,
            minVersion: 'TLSv1.2'
        });
    }
}
