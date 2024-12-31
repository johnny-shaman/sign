#[macro_use]
extern crate pest_derive;

use pest::Parser;

// Include the grammar - Adjust the path as necessary
#[derive(Parser)]
#[grammar = "sign.pest"]
pub struct Sign;

use pest::Rule;
use lazy_static::lazy_static;

lazy_static! {
    static ref SIGN_GRAMMAR: pest::Parser<Rule> = Sign::new();
    Sign
}


fn main() {
    let input = std::fs::read_to_string("example.sn").expect("Unable to read file");
    let pairs = Sign::parse(Rule::program, &input)
        .expect("Unsuccessful parse")
        .next().unwrap() // Get the first pair (assuming only one program)
        .into_inner(); // Get the inner pairs

    // Process the parse tree
    for pair in pairs {
        println!("Rule:    {:?}", pair.as_rule());
        println!("Span:    {:?}", pair.as_span());
        println!("Text:    {}", pair.as_str());

        // Further processing based on the rule
        match pair.as_rule() {
            Rule::identifier => {
                // Handle identifiers
                println!("Found identifier: {}", pair.as_str());
            },
            Rule::number => {
                // Handle numbers
                 println!("Found number: {}", pair.as_str());
            },
            // other rules
            _ => {},
        }

         // Recursively process children if needed
        if !pair.as_str().is_empty() {
           process_pairs(pair.into_inner());
        }
    }
}


fn process_pairs(pairs: pest::iterators::Pairs<Rule>) {
    for pair in pairs {
       println!("Inner Rule: {:?} - {}", pair.as_rule(), pair.as_str());
        if !pair.as_str().is_empty() {
           process_pairs(pair.into_inner());
        }
    }
}
