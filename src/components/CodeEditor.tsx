import CodeMirror from "@uiw/react-codemirror";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import React from "react";
import {Button} from "@/components/ui/button.tsx";

const CodeEditor = () => {
  const [value, setValue] = React.useState(`
    #!/bin/bash
    
    # Display a welcome message
    echo "Welcome to the Bash script!"
    
    # Prompt the user to enter a number
    read -p "Please enter a number: " number
    
    # Check if the number is even or odd
    if (( number % 2 == 0 )); then
        echo "The number $number is even."
    else
        echo "The number $number is odd."
    fi
    
    # Create a file and write to it
    file="output.txt"
    echo "This file was generated by the Bash script." > $file
    echo "The entered number is $number." >> $file
    
    # Read the file content and display it
    echo "Content of the file $file:"
    cat $file
    
    # End of script
    echo "Script finished."
    `);

  const onChange = React.useCallback((val: string) => {
    console.log("val:", val);
    setValue(val);
  }, []);

  return (
      <>
          <CodeMirror value={value} height="600px" extensions={[StreamLanguage.define(shell)]}
                      onChange={onChange}
                      basicSetup={{
                          lineNumbers: true,
                          tabSize: 4,
                          indentUnit: 4,
                          alignWideChars: false,
                          lineWrapping: true,
                          foldGutter: true,
                      }}
                      className="text-left"/>
          <div className="flex justify-end mt-4">
              <Button className="">Export</Button>
          </div>
      </>
  );
};

export default CodeEditor;
