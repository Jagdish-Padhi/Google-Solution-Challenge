import nodemailer from 'nodemailer';

let transporter = null;

function isEmailEnabled() {
	return Boolean(
		process.env.SMTP_HOST
		&& process.env.SMTP_PORT
		&& process.env.SMTP_USER
		&& process.env.SMTP_PASS
		&& process.env.EMAIL_FROM,
	);
}

function getTransporter() {
	if (!isEmailEnabled()) {
		return null;
	}

	if (transporter) {
		return transporter;
	}

	transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT),
		secure: Number(process.env.SMTP_PORT) === 465,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	return transporter;
}

export async function sendHighConfidenceViolationEmail({
	to,
	orgName,
	platform,
	sourceUrl,
	matchConfidence,
}) {
	const mailer = getTransporter();
	if (!mailer || !to) {
		return false;
	}

	const from = process.env.EMAIL_FROM;
	const subject = `SportShield Alert: High-confidence violation on ${platform}`;
	const textBody = [
		`Organization: ${orgName}`,
		`Platform: ${platform}`,
		`Confidence: ${matchConfidence}%`,
		`Source URL: ${sourceUrl}`,
		'',
		'Action recommended: review and mark as reported/resolved from the SportShield dashboard.',
	].join('\n');

	await mailer.sendMail({
		from,
		to,
		subject,
		text: textBody,
	});

	return true;
}
