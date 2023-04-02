import Artibot, { Module, SlashCommand } from "artibot";
import Localizer from "artibot-localizer";

import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from 'module';
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

/**
 * Cryptocurrencies market value
 * Uses Coinbase's API to get current values
 * @author GoudronViande24
 * @license MIT
 */
export default ({ config: { lang } }: Artibot): Module => {
	localizer.setLocale(lang);

	return new Module({
		id: "crypto",
		name: "Crypto",
		version,
		repo: "GoudronViande24/artibot-crypto",
		packageName: "artibot-crypto",
		langs: [
			"fr",
			"en"
		],
		parts: [
			new SlashCommand({
				id: "crypto",
				data: new SlashCommandBuilder()
					.setName("crypto")
					.setDescription(localizer._("Get the current value of a cryptocurrency."))
					.addStringOption(option =>
						option.setName("crypto")
							.setDescription(localizer._("The cryptocurrency to look for"))
							.setRequired(true)
							.addChoices({
								name: "Bitcoin",
								value: "BTC"
							}, {
								name: "Ethereum",
								value: "ETH"
							})
					),
				mainFunction
			})
		]
	});
}

const localizer: Localizer = new Localizer({
	filePath: path.join(__dirname, "../locales.json")
});

interface CryptoConfig {
	currencies?: string[];
}

/** Check value of a cryptocurrency */
async function mainFunction(interaction: ChatInputCommandInteraction<"cached">, { modules, version, config, createEmbed }: Artibot): Promise<void> {
	const cryptoConfig: CryptoConfig = config.crypto || {};
	const currencies: string[] = [];
	let costs: string = "";

	if (cryptoConfig.currencies) {
		currencies.push(...cryptoConfig.currencies);
	} else {
		currencies.push("CAD", "EUR", "USD");
	}

	const crypto: string = interaction.options.getString("crypto", true);

	for (const currency of currencies) {
		let url = `https://api.coinbase.com/v2/prices/${crypto}-${currency}/spot`;
		const request = await axios(url, {
			method: "GET",
			headers: {
				"User-Agent": `Artibot/${version} artibot-crypto/${modules.get("crypto")!.version}`
			}
		});

		let { data } = request.data;
		costs += `**${data.currency}**: ${parseFloat(data.amount).toFixed(2)}\n`;
	}

	const embed: EmbedBuilder = createEmbed()
		.setTitle(`${localizer._("Actual value")} - ${crypto}`)
		.setDescription(costs + "\n`" + localizer._("Data fetched from Coinbase") + "`");

	await interaction.reply({
		embeds: [embed]
	});
}