"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultStatement = exports.accountStatements = exports.suppliers = exports.customers = exports.currentAccounts = void 0;
exports.balanceMeta = balanceMeta;
exports.currentAccounts = [
    {
        id: 'CARI-001',
        name: 'Yildiz Insaat Ltd. Sti.',
        type: 'customer',
        taxNumber: '4560123789',
        city: 'Istanbul',
        phone: '0212 555 12 34',
        email: 'muhasebe@yildizinsaat.com',
        balance: 48250,
        creditLimit: 100000,
    },
    {
        id: 'CARI-002',
        name: 'Demir Tadilat & Dekorasyon',
        type: 'customer',
        taxNumber: '3210987654',
        city: 'Istanbul',
        phone: '0216 444 87 65',
        email: 'info@demirtadilat.com',
        balance: 12600,
        creditLimit: 50000,
    },
    {
        id: 'CARI-003',
        name: 'Anadolu Yapi Market',
        type: 'customer',
        taxNumber: '7890456123',
        city: 'Ankara',
        phone: '0312 333 21 09',
        email: 'siparis@anadoluyapi.com',
        balance: -3400,
        creditLimit: 75000,
    },
    {
        id: 'CARI-004',
        name: 'Kaya Muhendislik A.S.',
        type: 'customer',
        taxNumber: '1230456789',
        city: 'Izmir',
        phone: '0232 222 65 43',
        email: 'satinalma@kayamuh.com',
        balance: 27800,
        creditLimit: 120000,
    },
    {
        id: 'CARI-005',
        name: 'Bosch Turkiye Dagitim',
        type: 'supplier',
        taxNumber: '9876123450',
        city: 'Istanbul',
        phone: '0212 700 10 20',
        email: 'bayi@bosch-dagitim.com',
        balance: -64500,
        creditLimit: 200000,
    },
    {
        id: 'CARI-006',
        name: 'Makita Endustri Tic.',
        type: 'supplier',
        taxNumber: '6543210987',
        city: 'Kocaeli',
        phone: '0262 600 40 50',
        email: 'siparis@makita-tic.com',
        balance: -38900,
        creditLimit: 150000,
    },
    {
        id: 'CARI-007',
        name: 'Marshall Boya Bolge Bayi',
        type: 'supplier',
        taxNumber: '4567890123',
        city: 'Bursa',
        phone: '0224 500 30 60',
        email: 'bolge@marshallbayi.com',
        balance: -15200,
        creditLimit: 80000,
    },
    {
        id: 'CARI-008',
        name: 'Ercan Nalbur',
        type: 'customer',
        taxNumber: '2345678901',
        city: 'Istanbul',
        phone: '0212 611 09 88',
        email: 'ercannalbur@gmail.com',
        balance: 5900,
        creditLimit: 25000,
    },
];
function balanceMeta(balance) {
    if (balance > 0)
        return { label: 'Alacak', variant: 'success' };
    if (balance < 0)
        return { label: 'Borc', variant: 'destructive' };
    return { label: 'Kapali', variant: 'secondary' };
}
exports.customers = exports.currentAccounts.filter((a) => a.type === 'customer');
exports.suppliers = exports.currentAccounts.filter((a) => a.type === 'supplier');
exports.accountStatements = {
    'CARI-001': [
        {
            id: 'EXT-1',
            date: '2024-04-01',
            description: 'Devir bakiye',
            debit: 0,
            credit: 0,
            balance: 18000,
        },
        {
            id: 'EXT-2',
            date: '2024-04-05',
            description: 'FT-2024-0140 Satis Faturasi',
            debit: 32500,
            credit: 0,
            balance: 50500,
        },
        {
            id: 'EXT-3',
            date: '2024-04-12',
            description: 'Tahsilat - Havale',
            debit: 0,
            credit: 20000,
            balance: 30500,
        },
        {
            id: 'EXT-4',
            date: '2024-04-16',
            description: 'FT-2024-0147 Satis Faturasi',
            debit: 17750,
            credit: 0,
            balance: 48250,
        },
    ],
};
exports.defaultStatement = [
    {
        id: 'EXT-D1',
        date: '2024-04-01',
        description: 'Devir bakiye',
        debit: 0,
        credit: 0,
        balance: 0,
    },
    {
        id: 'EXT-D2',
        date: '2024-04-10',
        description: 'Satis Faturasi',
        debit: 12600,
        credit: 0,
        balance: 12600,
    },
];
