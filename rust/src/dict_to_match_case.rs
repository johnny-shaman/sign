use std::collections::HashMap;

fn transform_dict_to_match_case(node: &AstNode) -> AstNode {
    match node {
        AstNode::Expression(Box::Expression::Block(items)) => {
            let (transformed_items, _) = transform_block_to_match_case(items, 0);
            AstNode::Expression(Box::new(Expression::Block(transformed_items)))
        },
        _ => node.clone(),
    }
}

fn transform_block_to_match_case(items: &[AstNode], depth: usize) -> (Vec<AstNode>, usize) {
    let mut transformed_items = Vec::new();
    let mut temp_var_counter = depth;
    let mut nested_assignments = HashMap::new();

    for item in items {
        match item {
            AstNode::Expression(Box::Expression::Assign(key, value)) => {
                match value.as_ref() {
                    AstNode::Expression(Box::Expression::Block(nested_items)) => {
                        let temp_var = format!("_{}", temp_var_counter);
                        temp_var_counter += 1;

                        let (nested_transformed, new_counter) = transform_block_to_match_case(nested_items, temp_var_counter);
                        temp_var_counter = new_counter;

                        let match_case = AstNode::Expression(Box::new(Expression::MatchCase(
                            Box::new(AstNode::Value(Value::Identifier(temp_var.clone()))),
                            vec![(
                                AstNode::Value(Value::Literal(Literal::String(key.clone()))),
                                AstNode::Expression(Box::new(Expression::Block(nested_transformed)))
                            )]
                        )));

                        nested_assignments.insert(key.clone(), temp_var);
                        transformed_items.push(match_case);
                    },
                    _ => {
                        transformed_items.push(AstNode::Expression(Box::new(Expression::MatchCase(
                            Box::new(AstNode::Value(Value::Identifier(format!("_{}", depth)))),
                            vec![(
                                AstNode::Value(Value::Literal(Literal::String(key.clone()))),
                                value.as_ref().clone()
                            )]
                        ))));
                    }
                }
            },
            _ => transformed_items.push(item.clone()),
        }
    }

    // 入れ子になった割り当てを処理
    for (key, temp_var) in nested_assignments {
        transformed_items = transformed_items.into_iter().map(|item| {
            replace_nested_assignments(item, &key, &temp_var)
        }).collect();
    }

    (transformed_items, temp_var_counter)
}

fn replace_nested_assignments(node: AstNode, key: &str, temp_var: &str) -> AstNode {
    match node {
        AstNode::Expression(Box::Expression::MatchCase(scrutinee, cases)) => {
            let new_cases = cases.into_iter().map(|(pattern, body)| {
                (pattern, replace_nested_assignments(body, key, temp_var))
            }).collect();
            AstNode::Expression(Box::new(Expression::MatchCase(scrutinee, new_cases)))
        },
        AstNode::Value(Value::Identifier(id)) if id == key => {
            AstNode::Value(Value::Identifier(temp_var.to_string()))
        },
        _ => node,
    }
}
