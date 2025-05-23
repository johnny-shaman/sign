#ifndef CODEGEN_H
#define CODEGEN_H

#include <stdio.h>
#include "ast.h"

/* Cコード生成関数 */
void generateCCode(ASTNode* ast, FILE* output);

#endif /* CODEGEN_H */