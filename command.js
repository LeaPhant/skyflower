class Command {
    client;
    helper;

    constructor(_client, _helper, _db) {
        this.client = _client;
        this.helper = _helper;
        this.db = _db;
    }
}

export default Command;
