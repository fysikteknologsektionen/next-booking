import nodemailer from 'nodemailer'
import config from './config'
import Mail from 'nodemailer/lib/mailer';
import { NextResponse } from 'next/server';
import { formatDate } from '@/lib/helper';
import { Reservation } from '@prisma/client';

export function confirmationMail(reservation: Reservation, venue: string) {
    return `Hej!\n\nVi har mottagit följande bokning från dig:\nNamn på bokningsansvarig: ${reservation.clientName}\nLokal: ${venue}\nStarttid: ${reservation.startTime}\nSluttid: ${reservation.endTime}\n\n/Fysikteknologsektionens lokalbokning`
}

export function acceptMail(date: Date) {
    return `Hej!\n\nDin bokning ${formatDate(date)} är godkänd.\n\n/Fysikteknologsektionens lokalbokning`
}

export function denyMail(date: Date) {
    return `Hej!\n\nDin bokning ${formatDate(date)} har blivit nekad.\n\n/Fysikteknologsektionens lokalbokning`
}

export async function sendEmail(recipient:string|undefined, subject:string, message:string) {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.NODEMAILER_EMAIL,
            pass: config.NODEMAILER_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        },
    });

    // Abort mailing of no recipient given
    if (!recipient) {
        return NextResponse.json({ message: 'No recipient given' });
    }
    const mailOptions: Mail.Options = {
        from: config.NODEMAILER_EMAIL,
        to: recipient,
        subject: subject,
        text:message,
    };

    const sendMailPromise = () =>
        new Promise<string>((resolve, reject) => {
            transport.sendMail(mailOptions, function (err) {
                if (!err) {
                    resolve('Email sent');
                } else {
                    reject(err.message);
                }
            });
        });

    try {
        await sendMailPromise();
        return NextResponse.json({ message: 'Email sent' });
    } catch (err) {
        console.log(`Mail error: ${err}`);
        return NextResponse.json({ error:err }, { status:500 });
    }
}