module.exports = {
    command: ['pack', 'packs'],
    description: "Display info on how to get the resource packs used on the site.",
    call: () => {
        return {
            embed: {
                title: "What's the texture pack on the site?",
                description: "There's multiple packs being used, you can find out which one is being used for the item you're looking at yourself. Clicking the resource pack's name leads you to its thread on the Hypixel Forums.",
                color: 11809405,
                image: {
                    url: "https://cdn.discordapp.com/attachments/572429763700981780/692756081365090315/pack.gif"
                }
            }
        }
    }
};
