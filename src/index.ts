import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export default {
	async email(message, env, ctx) {
		const content = await new Response(message.raw).text();
		const messages = [
			{ role: 'system', content: 'you are an email responder, reply to the given message' },
			{ role: 'user', content },
		];
		// @ts-expect-error broken bindings
		const { response } = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { messages });
		const msg = createMimeMessage();
		msg.setHeader('In-Reply-To', message.headers.get('Message-ID') as string);
		msg.setSender({ name: 'Sean Behan', addr: 'contact@seanbehan.ca' });
		msg.setRecipient(message.from);
		msg.setSubject('RE');
		msg.addMessage({
			contentType: 'text/plain',
			data: `${response}\n\nThis was an automated message. If this is urgent, message Sean on Telegram https://t.me/codebam`,
		});

		const replyMessage = new EmailMessage('contact@seanbehan.ca', message.from, msg.asRaw());

		await message.reply(replyMessage);
		await message.forward('codebam@riseup.net');
	},
} satisfies ExportedHandler<Env>;
