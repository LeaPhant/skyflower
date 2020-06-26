const helper = require('../helper.js');

module.exports = {
    command: ['uwuify', 'owoify'],
    usage: '[text]',
    example: 'uwify hello',
    call: obj => {
        let { last_message, argv, msg, client } = obj;

        let input = "", output = "";

        if(argv.length < 2 && msg.channel.id in last_message){
            input = last_message[msg.channel.id];
        }else if(argv.length < 2){
            return "no message to uwuify ;-;";
        }else{
            input = argv.slice(1).join(' ');
        }

        for(let i = 0; i < input.length; i++){
            let char = input.charAt(i);
            
            switch(char){
                case 'r':
                case 'l':
                    output += 'w';
                    break;
                case 'R':
                case 'L':
                    output += 'W';
                    break;
                case 't':
                case 'T':
                    let check = input.charAt(i + 1);
                    
                    if(check.toLowerCase() == 'h'){
                        if(char == 't')
                            output += 'd';
                        else
                            output += 'D';
                        i++;
                    }else{
                        output += char;
                    }
                    
                    break;
                default:
                    output += char;
            }
        }
        
        output = helper.replaceAll(output, "you", "yuw");
        output = helper.replaceAll(output, "fuck", "fack");
        output = helper.replaceAll(output, "fuk", "fak");
        
        output = output.trim() + " uwu";
        
        return output;
    }
};
