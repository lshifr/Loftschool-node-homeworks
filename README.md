# Loftschool-node-homeworks
Homeworks for the node.js course in LoftSchool

## Homework 1 - асинхронная категоризация файлов

### Установка


    git clone https://github.com/lshifr/Loftschool-node-homeworks.git
    cd Loftschool-node-homeworks
    git checkout homework-1
    npm install
    
### Использование

Чтобы увидеть доступные опции, можно воспользоваться опцией help

    node app --help
    
которая выдаст что-то вроде этого    
    
    Options:
      --help                 Show help                                     [boolean]
      --version              Show version number                           [boolean]
      --source, -s           Source folder
      --destination, -d      Destination folder
      --verbose, -v          Run with verbose logging                      [boolean]
      --delete-source, --ds  Delete the source folder                      [boolean]
        
В проекте имеется тестовый набор файлов по адресу `/SampleFiles/Westerns`. 
Простой вызов без параметров будет работать с ними, и писать результат в
`/SampleFiles/NewFiles`:

    node app
    
Для задания другой исходной папки можно использовать `--source` или `-s`, 
и аналогично `--destination` или `-d` для конечной папки:

    node app -s=your-source-folder -d=your-target-folder 
    
Удаление исходной папки отключено по умолчанию. Если это требуется, то 
нужно использовать флаг `--delete-source`, или `--ds`:

    node app -s=your-source-folder -d=your-target-folder --ds
    
При желании можно включить режим `verbose`, в котором в консоль будут 
выводиться сообщения о производимых операциях:

    node app -v
    