import nodemailer from 'nodemailer'
import config from './config'
import Mail from 'nodemailer/lib/mailer';
import { NextResponse } from 'next/server';
import { formatDate, getReservationTypeLabel } from '@/lib/helper';
import { Reservation } from '@prisma/client';

export async function confirmationMail(reservation: Reservation, venue: string) {
    const mail = makeEmail(reservation, venue, "Bokningsbekräftelse", "Hej! Detta är en bekräftelse på att din bokningsförfrågan har registrerats. När din bokningsförfrågan har blivit behandlad får du ett nytt mail.");
    return await sendEmail(reservation.clientEmail, "Bokningsbekräftelse", mail);
}

export async function acceptMail(reservation: Reservation, venue: string) {
    const mail = makeEmail(reservation, venue, "Bokning godkänd", "Hej! Din bokningsförfrågan har blivit godkänd.");
    return await sendEmail(reservation.clientEmail, "Bokning godkänd", mail);
}

export async function denyMail(reservation: Reservation, venue: string, auto: boolean) {
    let message = "Hej! Din bokningsförfrågan har blivit nekad";
    if (auto) message += " då vald tid redan är bokad";
    message += ". Du kan kontakta <a href=\"mailto:dp.rust@ftek.se\" target=\"_top\">dp.rust@ftek.se</a> för mer information.";

    const mail = makeEmail(reservation, venue, "Bokning nekad", message);
    return await sendEmail(reservation.clientEmail, "Bokning nekad", mail);
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

function makeEmail(reservation: Reservation, venue: string, header: string, message: string) {
    let date = formatDate(reservation.startTime) + ' - ' + formatDate(reservation.endTime);
  
    const regex = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) - (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/;
    const match = date.match(regex);
    if (match) {
        const [ , firstDate, firstTime, secondDate, secondTime ] = match;
        if (firstDate === secondDate) {
            date = `${firstDate} ${firstTime} - ${secondTime}`;
        }
    }
  
    let mail = '<!DOCTYPE html><html><head><base target="_top"></head><body><div style="text-align: center;' +
        'font-family: Arial;"><div id="center" style="width:400px;border: 2px dotted grey;background:' +
        '#ececec; margin:25px;margin-left:auto; margin-right:auto;padding:15px;">' +
        '<img src="https://ftek.se/wp-content/uploads/ftek-documents/logotyper/sektionslogo-noring.png" width="120px"></img>' +
        '<div style=" border: 2px dotted grey;' +
        'background:white;margin-right:auto; margin-left:auto; padding:10px; text-align:left;"><h2 style="text-align:center;">' +
        header +
        '</h2>' +
        message +
        '<br /><br/><h3 style="margin-bottom:auto;">Bokningsinformation:</h3><br/>Lokal: ' +
        venue +
        '<br />Namn: ' +
        reservation.clientName +
        '<br />';

    if (reservation.clientCommittee != null) {
        mail += 'Kommitté: ' + reservation.clientCommittee + '<br />';
    }

    mail += 'Typ av bokning: ' +
        getReservationTypeLabel(reservation.type) +
        '<br />Beskrivning: ' +
        reservation.clientDescription +
        '<br />Tid: ' + 
        date +
        '<br /><br /><br />' +
        '<div style="text-align:center;"><a href="' +
        'https://boka.ftek.se/#calendar' +
        '" class="btn" style="-webkit-border-radius: 28;' +
        '-moz-border-radius: 5;border-radius: 5px;font-family: Arial; color: #ffffff;font-size: 15px;' +
        'background: #8D0000;padding:8px 20px 8px 20px;text-decoration: none;">' +
        'Visa kalender' +
        '</a></div><br /><br /><p style=" text-align:right;">/ Fysikteknologsektionens lokalbokning</p></div></div></body></html>';

    return mail;
}