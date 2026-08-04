// Example bot logic, written the way a real discord.js bot would be —
// this file has zero knowledge that it's being tested with mocks.

export async function handleBanCommand(interaction) {
  const target = interaction.options.getUser("target");
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!interaction.member.permissions.has("BanMembers")) {
    await interaction.reply({
      content: "You don't have permission to ban members.",
      ephemeral: true,
    });
    return;
  }

  if (!target) {
    await interaction.reply({ content: "You must specify a user to ban." });
    return;
  }

  // pretend we actually banned them here
  await interaction.reply({
    content: `Banned ${target.username} for: ${reason}`,
  });
}

export async function handlePingCommand(interaction) {
  await interaction.deferReply();
  // simulate some async work (DB call, API call, etc.)
  await interaction.editReply({ content: "Pong!" });
}
