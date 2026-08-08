// Example component, modal, autocomplete, and error-path handlers.

export async function handleConfirmButton(interaction) {
  if (interaction.customId !== "confirm-delete") return;
  await interaction.update({ content: "Deleted.", components: [] });
}

export async function handleColorSelect(interaction) {
  await interaction.reply({
    content: `Selected: ${interaction.values.join(", ")}`,
    ephemeral: true,
  });
}

export async function handleReportModal(interaction) {
  const reason = interaction.fields.getTextInputValue("reason");
  await interaction.reply({ content: `Report submitted: ${reason}` });
}

export async function handleFruitAutocomplete(interaction) {
  const focused = String(interaction.options.getFocused() ?? "").toLowerCase();
  const fruits = ["apple", "banana", "blueberry"];
  await interaction.respond(
    fruits
      .filter((fruit) => fruit.startsWith(focused))
      .map((fruit) => ({ name: fruit, value: fruit })),
  );
}

export async function handleAnnouncement(channel) {
  try {
    await channel.send("Launch complete.");
    return "sent";
  } catch (error) {
    if (error.code === 50013) return "missing-permissions";
    throw error;
  }
}

