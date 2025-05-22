const nodemailer = require("nodemailer");
const config = require("../config/config");

// Create transporter
const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
    },
});

// Send verification email
const sendVerificationEmail = async (user, token) => {
    const verificationUrl = `${config.app.url}/auth/verify-email/${token}`;

    const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: "Email Verification",
        html: `
      <h1>Verify Your Email</h1>
      <p>Hello ${user.first_name || user.username},</p>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for an account, please ignore this email.</p>
    `,
    };

    return transporter.sendMail(mailOptions);
};

// Send invitation email
const sendInvitationEmail = async (invitation, company) => {
    const invitationUrl = `${config.app.frontendUrl}/invitations/${invitation.token}`;

    const mailOptions = {
        from: config.email.from,
        to: invitation.email,
        subject: `Invitation to join ${company.name}`,
        html: `
      <h1>You've Been Invited</h1>
      <p>Hello,</p>
      <p>You have been invited to join ${company.name} on our platform.</p>
      <p>Click the link below to accept the invitation and set up your account:</p>
      <a href="${invitationUrl}">Accept Invitation</a>
      <p>This invitation expires in 7 days.</p>
      <p>If you did not expect this invitation, please ignore this email.</p>
    `,
    };

    return transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
    const resetUrl = `${config.app.frontendUrl}/reset-password/${token}`;

    const mailOptions = {
        from: config.email.from,
        to: user.email,
        subject: "Password Reset Request",
        html: `
      <h1>Password Reset</h1>
      <p>Hello ${user.first_name || user.username},</p>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
    sendInvitationEmail,
    sendPasswordResetEmail,
};
