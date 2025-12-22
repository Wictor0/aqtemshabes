import NextAuth from 'next-auth';
import { authOptions } from '@/app/lib/auth'; // Importando do arquivo que criamos acima

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };