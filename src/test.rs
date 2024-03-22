let assign = Sign::parse("
x: 3
x
");

let dataConstructor0 = Sign::parse("
p: 1, 2
p
");

let dataConstructor1 = Sign::parse("
p: (1 2)
p
");

let dataConstructor2 = Sign::parse("
p: (1, 2)
p
");

let dataConstructor3 = Sign::parse("
p: {1 2}
p
");

let dataConstructor4 = Sign::parse("
p: {1, 2}
p
");

let dataConstructor5 = Sign::parse("
p: [1 2]
p
");

let dataConstructor6 = Sign::parse("
p: [1 2]
p
");

let dictionary = Sign::parse("

")

#[cfg(test)]
mod tests {
    use super::*;

    fn assign () {
        let x = Sign::parse("./assign.sn");
        assert_eq!(x, 3)
    }

}